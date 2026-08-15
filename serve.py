#!/usr/bin/env python3
"""Dev server. Sends no-store so edited modules actually reload."""
import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def log_message(self, *a): pass
if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8412
    print(f'http://localhost:{port}')
    http.server.HTTPServer(('127.0.0.1', port), H).serve_forever()
