# backend/terminal_engine.py

import os
import shlex
from typing import List, Dict, Tuple

class VirtualFileSystem:
    def __init__(self):
        self.current_path = "/home/commander"
        self.filesystem = {
            "/home": {"commander": {}, "guest": {}},
            "/etc": {"config.txt": "system config"},
            "/bin": {},
            "/var": {"logs": {}},
            "/logs": {},
        }

    def get_absolute_path(self, path: str) -> str:
        if path.startswith("/"):
            return path
        else:
            return os.path.join(self.current_path, path)

    def normalize_path(self, path: str) -> str:
        return os.path.normpath(path)

    def ls(self, path: str = None) -> List[str]:
        if path is None:
            path = self.current_path
        abs_path = self.get_absolute_path(path)
        abs_path = self.normalize_path(abs_path)

        # Navigate to the directory
        parts = abs_path.split("/")
        current = self.filesystem
        for part in parts:
            if part == "":
                continue
            if part in current:
                current = current[part]
            else:
                return []

        # List contents
        if isinstance(current, dict):
            return list(current.keys())
        else:
            return [abs_path]

    def cd(self, path: str) -> str:
        if path == "~":
            path = "/home/commander"
        abs_path = self.get_absolute_path(path)
        abs_path = self.normalize_path(abs_path)

        # Check if directory exists
        parts = abs_path.split("/")
        current = self.filesystem
        for part in parts:
            if part == "":
                continue
            if part in current and isinstance(current[part], dict):
                current = current[part]
            else:
                return f"cd: {path}: No such file or directory"

        self.current_path = abs_path
        return ""

    def pwd(self) -> str:
        return self.current_path

    def mkdir(self, path: str) -> str:
        abs_path = self.get_absolute_path(path)
        abs_path = self.normalize_path(abs_path)

        parts = abs_path.split("/")
        current = self.filesystem
        for i, part in enumerate(parts):
            if part == "":
                continue
            if part not in current:
                if i == len(parts) - 1:
                    current[part] = {}
                else:
                    return f"mkdir: cannot create directory '{path}': No such file or directory"
            else:
                if not isinstance(current[part], dict):
                    return f"mkdir: cannot create directory '{path}': Not a directory"
            current = current[part]
        return ""

    def rmdir(self, path: str) -> str:
        abs_path = self.get_absolute_path(path)
        abs_path = self.normalize_path(abs_path)

        if abs_path == "/":
            return "rmdir: cannot remove root directory"

        parts = abs_path.split("/")
        current = self.filesystem
        for i, part in enumerate(parts):
            if part == "":
                continue
            if part in current:
                if i == len(parts) - 1:
                    if isinstance(current[part], dict) and not current[part]:
                        del current[part]
                    else:
                        return f"rmdir: failed to remove '{path}': Directory not empty"
                else:
                    current = current[part]
            else:
                return f"rmdir: failed to remove '{path}': No such file or directory"
        return ""

    def touch(self, path: str) -> str:
        abs_path = self.get_absolute_path(path)
        abs_path = self.normalize_path(abs_path)

        parts = abs_path.split("/")
        filename = parts[-1]
        dir_parts = parts[:-1]

        current = self.filesystem
        for part in dir_parts:
            if part == "":
                continue
            if part not in current:
                return f"touch: cannot touch '{path}': No such file or directory"
            current = current[part]

        current[filename] = ""
        return ""

    def rm(self, path: str) -> str:
        abs_path = self.get_absolute_path(path)
        abs_path = self.normalize_path(abs_path)

        parts = abs_path.split("/")
        filename = parts[-1]
        dir_parts = parts[:-1]

        current = self.filesystem
        for part in dir_parts:
            if part == "":
                continue
            if part in current:
                current = current[part]
            else:
                return f"rm: cannot remove '{path}': No such file or directory"

        if filename in current:
            del current[filename]
        else:
            return f"rm: cannot remove '{path}': No such file or directory"
        return ""

    def cat(self, path: str) -> str:
        abs_path = self.get_absolute_path(path)
        abs_path = self.normalize_path(abs_path)

        parts = abs_path.split("/")
        current = self.filesystem
        for part in parts:
            if part == "":
                continue
            if part in current:
                current = current[part]
            else:
                return f"cat: {path}: No such file or directory"

        if isinstance(current, dict):
            return f"cat: {path}: Is a directory"
        else:
            return current

    def echo(self, text: str, path: str = None) -> str:
        if path is None:
            return text
        else:
            abs_path = self.get_absolute_path(path)
            abs_path = self.normalize_path(abs_path)

            parts = abs_path.split("/")
            filename = parts[-1]
            dir_parts = parts[:-1]

            current = self.filesystem
            for part in dir_parts:
                if part == "":
                    continue
                if part in current:
                    current = current[part]
                else:
                    return f"echo: cannot write to '{path}': No such file or directory"

            current[filename] = text
            return ""

    def cp(self, src: str, dst: str) -> str:
        src_abs = self.get_absolute_path(src)
        src_abs = self.normalize_path(src_abs)
        dst_abs = self.get_absolute_path(dst)
        dst_abs = self.normalize_path(dst_abs)

        # Get source content
        src_parts = src_abs.split("/")
        current = self.filesystem
        for part in src_parts:
            if part == "":
                continue
            if part in current:
                current = current[part]
            else:
                return f"cp: cannot stat '{src}': No such file or directory"
        src_content = current

        # Get destination directory
        dst_parts = dst_abs.split("/")
        dst_dir = self.filesystem
        for part in dst_parts:
            if part == "":
                continue
            if part in dst_dir:
                dst_dir = dst_dir[part]
            else:
                # Assume the last part is the new file name
                pass

        # If dst is a directory, use the same filename
        if isinstance(dst_dir, dict):
            dst_dir[src_parts[-1]] = src_content
        else:
            # Overwrite the file
            pass  # This is a simplification, we assume dst is a file path

        return ""

    def mv(self, src: str, dst: str) -> str:
        # For simplicity, we do cp and then rm
        result = self.cp(src, dst)
        if result:
            return result
        return self.rm(src)

    def grep(self, pattern: str, path: str) -> str:
        content = self.cat(path)
        if content.startswith("grep:"):
            return content
        lines = content.split("\n")
        result = [line for line in lines if pattern in line]
        return "\n".join(result)

    def find(self, path: str, name: str) -> str:
        # This is a simplified version
        abs_path = self.get_absolute_path(path)
        abs_path = self.normalize_path(abs_path)

        def _find(current, current_path, results):
            for key, value in current.items():
                full_path = os.path.join(current_path, key)
                if key == name:
                    results.append(full_path)
                if isinstance(value, dict):
                    _find(value, full_path, results)

        results = []
        parts = abs_path.split("/")
        current = self.filesystem
        for part in parts:
            if part == "":
                continue
            if part in current:
                current = current[part]
            else:
                return f"find: '{path}': No such file or directory"

        _find(current, abs_path, results)
        return "\n".join(results)

class TerminalEngine:
    def __init__(self):
        self.vfs = VirtualFileSystem()
        self.history = []

    def process_command(self, command: str) -> str:
        self.history.append(command)
        parts = shlex.split(command)
        if not parts:
            return ""

        cmd = parts[0]
        args = parts[1:]

        if cmd == "ls":
            return "\n".join(self.vfs.ls(*args))
        elif cmd == "cd":
            return self.vfs.cd(*args)
        elif cmd == "pwd":
            return self.vfs.pwd()
        elif cmd == "mkdir":
            return self.vfs.mkdir(*args)
        elif cmd == "rmdir":
            return self.vfs.rmdir(*args)
        elif cmd == "touch":
            return self.vfs.touch(*args)
        elif cmd == "rm":
            return self.vfs.rm(*args)
        elif cmd == "cat":
            return self.vfs.cat(*args)
        elif cmd == "echo":
            if len(args) == 0:
                return ""
            elif len(args) == 1:
                return self.vfs.echo(args[0])
            else:
                # Assume the last argument is the file
                text = " ".join(args[:-1])
                return self.vfs.echo(text, args[-1])
        elif cmd == "cp":
            if len(args) != 2:
                return "cp: missing file operand"
            return self.vfs.cp(args[0], args[1])
        elif cmd == "mv":
            if len(args) != 2:
                return "mv: missing file operand"
            return self.vfs.mv(args[0], args[1])
        elif cmd == "grep":
            if len(args) != 2:
                return "grep: missing pattern or file"
            return self.vfs.grep(args[0], args[1])
        elif cmd == "find":
            if len(args) != 2:
                return "find: missing path or name"
            return self.vfs.find(args[0], args[1])
        elif cmd == "clear":
            return "\033[2J\033[H"  # ANSI escape codes to clear screen
        elif cmd == "whoami":
            return "commander"
        elif cmd == "date":
            from datetime import datetime
            return datetime.now().strftime("%a %b %d %H:%M:%S %Z %Y")
        elif cmd == "uname":
            return "Linux aurora-x 5.10.0-aurora #1 SMP Fri Jan 1 00:00:00 UTC 2021 x86_64 GNU/Linux"
        elif cmd == "history":
            return "\n".join([f"{i+1}  {cmd}" for i, cmd in enumerate(self.history[-10:])])
        elif cmd == "help":
            return """Available commands:
ls, cd, pwd, mkdir, rmdir, touch, rm, cat, echo, cp, mv, grep, find,
clear, whoami, date, uname, history, help
"""
        else:
            return f"{cmd}: command not found"

# Example usage:
if __name__ == "__main__":
    term = TerminalEngine()
    print(term.process_command("pwd"))
    print(term.process_command("ls"))
    print(term.process_command("cd /"))
    print(term.process_command("ls"))
