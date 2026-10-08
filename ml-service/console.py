"""Console output helper.

Windows terminals default to a legacy code page (cp1252), which makes Python
raise `UnicodeEncodeError` as soon as a script prints a character such as an
arrow or a check mark. Calling `setup_console()` at the top of every entry point
switches stdout/stderr to UTF-8 with replacement fallback, so the printed tables
look the same on Windows, macOS and Linux.
"""

import sys


def setup_console() -> None:
    """Forces UTF-8 output where the stream supports being reconfigured."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (ValueError, OSError):  # stream already detached / not a text stream
                pass