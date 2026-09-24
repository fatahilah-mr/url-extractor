# Architecture Decision Record (ADR-001): 100% Client-Side URL Extraction Engine

## Status
Accepted

## Context
Aplikasi URL Extractor dirancang untuk mengekstrak, membersihkan, dan mengelola tautan web dari teks panjang acak (seperti artikel, memo, catatan teknis, atau takarir media sosial). Kebutuhan sistem mencakup pemrosesan instan, privasi mutlak pengguna, nol biaya komputasi server, dan ketersediaan offline tinggi.

## Decision
Kami memutuskan untuk mengimplementasikan arsitektur **100% Client-Side Engine**:
1. Seluruh pemrosesan teks, normalisasi batas karakter (*boundary cleanup*), dan regex parsing dijalankan di dalam browser pengguna (JavaScript runtime).
2. Hosting menggunakan Cloudflare Pages static edge network.
3. Tidak ada API backend, basis data, atau pelacak pihak ketiga yang terlibat.

## Consequences & Trade-offs
### Positive:
- **Zero Server Compute & Zero Operational Cost**: Biaya server Rp0/bulan terlepas dari volume trafik atau panjang teks yang diproses.
- **Maximum Data Privacy (GDPR & UU PDP Compliant)**: Teks pengguna tidak pernah meninggalkan peramban lokal.
- **Offline & Low Latency**: Waktu pemrosesan di bawah 50ms langsung di RAM browser.
- **High Security**: Permukaan serangan (*attack surface*) minimal karena tidak ada server database atau endpoint backend dinamis.

### Negative & Mitigations:
- **Client Resource Dependency**: Pemrosesan teks bergantung pada kekuatan CPU perangkat pengguna.
  - *Mitigasi*: Algoritma parsing regex dirancang dengan kompleksitas waktu linier O(N) tanpa *catastrophic backtracking*, dilengkapi *micro-debounce* 40ms dan *DocumentFragment* batching untuk mencegah *frame drop*.
