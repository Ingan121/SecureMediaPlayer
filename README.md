# SecureMediaPlayer
* Simple Electron-based protected media player that appears to be pretty "secure"
* To use: change the encryption keys in [main.js:66](https://github.com/Ingan121/SecureMediaPlayer/blob/1ab02f1a20f032706c64ed6dbd6877e15437623a/main.js#L66) and distribute it obfuscated.
* To encrypt: `openssl enc -aes-128-cbc -K (key in hex) -iv (IV in hex) -in filename.mp4 -out filename.sev`


~~K011us Player is basically this~~
