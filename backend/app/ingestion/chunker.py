import re
from typing import List, Dict, Any, Optional


class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        doc_id: str,
        page: int,
        section: str,
        text: str,
        parent_text: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.chunk_id = chunk_id
        self.doc_id = doc_id
        self.page = page
        self.section = section
        self.text = text
        self.parent_text = parent_text or text
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "doc_id": self.doc_id,
            "page": self.page,
            "section": self.section,
            "text": self.text,
            "parent_text": self.parent_text,
            "metadata": self.metadata,
        }


class Chunker:
    def __init__(
        self,
        chunk_size: int = 750,
        chunk_overlap: int = 120,
        child_chunk_size: int = 350,
        child_chunk_overlap: int = 60,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.child_chunk_size = child_chunk_size
        self.child_chunk_overlap = child_chunk_overlap

    def chunk_pages(
        self,
        doc_id: str,
        pages: List[Dict[str, Any]],
        strategy: str = "parent_child",
    ) -> List[DocumentChunk]:
        """
        Chunks pages preserving metadata (doc_id, page, section).
        Supports:
          - 'parent_child': creates clean parent chunks and boundary-safe child chunks
          - 'page_aware': standard chunks split within page boundaries on sentence/word limits
          - 'fixed': sliding window chunks across document
        """
        if strategy == "parent_child":
            return self._parent_child_chunking(doc_id, pages)
        elif strategy == "page_aware":
            return self._page_aware_chunking(doc_id, pages)
        else:
            return self._fixed_chunking(doc_id, pages)

    def _split_into_atomic_units(self, text: str) -> List[str]:
        """
        Splits text into coherent atomic lines or sentences without cutting words.
        Handles both paragraph breaks, newlines, and sentence terminators.
        """
        raw_lines = [l.strip() for l in text.split("\n") if l.strip()]
        units = []
        for line in raw_lines:
            # If line is longer than chunk_size, split by sentences
            if len(line) > self.chunk_size:
                sentence_splits = re.split(r"(?<=[.!?])\s+", line)
                for s in sentence_splits:
                    s_clean = s.strip()
                    if not s_clean:
                        continue
                    if len(s_clean) > self.chunk_size:
                        # Split by words as final fallback
                        words = s_clean.split(" ")
                        cur_w = []
                        cur_len = 0
                        for w in words:
                            if cur_len + len(w) + 1 > self.chunk_size and cur_w:
                                units.append(" ".join(cur_w))
                                cur_w = [w]
                                cur_len = len(w)
                            else:
                                cur_w.append(w)
                                cur_len += len(w) + 1
                        if cur_w:
                            units.append(" ".join(cur_w))
                    else:
                        units.append(s_clean)
            else:
                units.append(line)
        return units

    def _page_aware_chunking(
        self, doc_id: str, pages: List[Dict[str, Any]]
    ) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []

        for p in pages:
            page_num = p["page"]
            section = p.get("section", "General")
            text = p["text"]
            if not text:
                continue

            atomic_units = self._split_into_atomic_units(text)
            cur_units: List[str] = []
            cur_len = 0

            for unit in atomic_units:
                added_len = len(unit) + (1 if cur_units else 0)
                if cur_len + added_len > self.chunk_size and cur_units:
                    chunk_text = "\n".join(cur_units)
                    chunk_id = f"{doc_id}_p{page_num}_{len(chunks)}"
                    chunks.append(
                        DocumentChunk(
                            chunk_id=chunk_id,
                            doc_id=doc_id,
                            page=page_num,
                            section=section,
                            text=chunk_text,
                            parent_text=chunk_text,
                        )
                    )

                    # Compute overlap units
                    overlap_units: List[str] = []
                    o_len = 0
                    for u in reversed(cur_units):
                        if o_len + len(u) <= self.chunk_overlap:
                            overlap_units.insert(0, u)
                            o_len += len(u) + 1
                        else:
                            break

                    cur_units = overlap_units + [unit]
                    cur_len = sum(len(u) for u in cur_units) + max(0, len(cur_units) - 1)
                else:
                    cur_units.append(unit)
                    cur_len += added_len

            if cur_units:
                chunk_text = "\n".join(cur_units)
                chunk_id = f"{doc_id}_p{page_num}_{len(chunks)}"
                chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        doc_id=doc_id,
                        page=page_num,
                        section=section,
                        text=chunk_text,
                        parent_text=chunk_text,
                    )
                )

        return chunks

    def _parent_child_chunking(
        self, doc_id: str, pages: List[Dict[str, Any]]
    ) -> List[DocumentChunk]:
        """
        Creates larger parent chunks (for high context), and boundary-aware child chunks
        for fine-grained vector and lexical retrieval.
        """
        parent_chunks = self._page_aware_chunking(doc_id, pages)
        all_chunks: List[DocumentChunk] = []

        for parent in parent_chunks:
            p_text = parent.text
            if len(p_text) <= self.child_chunk_size:
                all_chunks.append(parent)
                continue

            # Split parent cleanly into child segments without slicing words
            atomic_lines = [l.strip() for l in p_text.split("\n") if l.strip()]
            child_units: List[str] = []
            cur_child: List[str] = []
            cur_c_len = 0
            child_idx = 0

            for line in atomic_lines:
                if cur_c_len + len(line) + 1 > self.child_chunk_size and cur_child:
                    child_text = "\n".join(cur_child)
                    all_chunks.append(
                        DocumentChunk(
                            chunk_id=f"{parent.chunk_id}_c{child_idx}",
                            doc_id=doc_id,
                            page=parent.page,
                            section=parent.section,
                            text=child_text,
                            parent_text=p_text,
                        )
                    )
                    child_idx += 1

                    # overlap
                    overlap_units = []
                    o_len = 0
                    for u in reversed(cur_child):
                        if o_len + len(u) <= self.child_chunk_overlap:
                            overlap_units.insert(0, u)
                            o_len += len(u) + 1
                        else:
                            break
                    cur_child = overlap_units + [line]
                    cur_c_len = sum(len(u) for u in cur_child) + max(0, len(cur_child) - 1)
                else:
                    cur_child.append(line)
                    cur_c_len += len(line) + (1 if cur_child else 0)

            if cur_child:
                child_text = "\n".join(cur_child)
                all_chunks.append(
                    DocumentChunk(
                        chunk_id=f"{parent.chunk_id}_c{child_idx}",
                        doc_id=doc_id,
                        page=parent.page,
                        section=parent.section,
                        text=child_text,
                        parent_text=p_text,
                    )
                )

        return all_chunks

    def _fixed_chunking(
        self, doc_id: str, pages: List[Dict[str, Any]]
    ) -> List[DocumentChunk]:
        return self._page_aware_chunking(doc_id, pages)
