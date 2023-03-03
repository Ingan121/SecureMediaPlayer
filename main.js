// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    dialog,
    session,
    protocol
} = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
let filePath = '';
	
// Debugger protection
if (process.argv.length > 2)
	process.exit();
else if (process.argv.length == 2)
	if (!process.argv[1].includes('.sev') || process.argv[0].includes('--'))
		process.exit();
	else
		filePath = process.argv[1];

// VM protection
const vm_detection = require('vm-detection');
const vmware = vm_detection.vmware(), vbox = vm_detection.virtualBox(), qemu = vm_detection.qemu(), wine = vm_detection.wine(), sbie = vm_detection.sandboxie();

if (vm_detection.cpuRdtsc(true, 10, 500).isVM || vmware.scsi || vmware.registry || vmware.mouseDriver || vmware.graphicsDriver || vmware.wmiSerial || vbox.scsi || vbox.biosVersion ||
	vbox.systemFiles || vbox.nicMacAddress || vbox.guestAdditions || vbox.acpi || vbox.fadtAcpi || vbox.rsdtAcpi || vbox.service || vbox.systemBiosDate || vbox.deviceDrivers ||
	vbox.trayWindow || vbox.sharedNetwork || vbox.processes || vbox.wmi || qemu.scsi || qemu.systemBios || qemu.cpuBrand || wine.unixFileName || wine.registry || sbie.dll)
	process.exit();

/*console.log('vmware', vm_detection.vmware());
console.log('virtual box', vm_detection.virtualBox());
console.log('qemu', vm_detection.qemu());
console.log('wine', vm_detection.wine());
console.log('sandboxie', vm_detection.sandboxie());*/

protocol.registerSchemesAsPrivileged([{
		scheme: 'http',
		privileges: {
			stream: true
		}
	}
])

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720
    });

	// Screenshot / screenrecord protection
    mainWindow.setContentProtection(true);

    // and load the index.html of the app.
    mainWindow.loadURL('data:text/html,<!DOCTYPE html><html><head><title>Secure Media Player</title><meta charset="utf-8"></head><body style="overflow:hidden;margin:0;background:black"><video style="width:100vw;height:100vh;outline:none" controls autoplay controlsList="nodownload" disablePictureInPicture></video></body></html>');

    // Remove the menu bar
    mainWindow.removeMenu();

    protocol.registerStreamProtocol('http', (req, callback) => {
        const range = req.headers.Range;
        const size = fs.statSync(filePath).size;
        const decipher = crypto.createDecipheriv('aes-128-cbc', "youfoundthislmao", "iknewsomeonewill");
        decipher.setAutoPadding(false);
        // bytes= 부분을 없애고 - 단위로 문자열을 자름
        const parts = range.replace(/bytes=/, '').split('-');
        // 시작 부분의 문자열을 정수형으로 변환
        const start = parseInt(parts[0]);
        // 끝 부분의 문자열을 정수형으로 변환 (끝 부분이 없으면 총 파일 사이즈에서 - 1)
        const end = parts[1] ? parseInt(parts[1]) : size - 1;
        // 내보낼 부분의 길이
        const chunk = end - start + 1;
        // 시작 부분과 끝 부분의 스트림을 읽음
        const stream = fs.createReadStream(filePath, {
            start,
            end
        });
        callback({
            statusCode: 206,
            headers: {
                'Content-Range': `bytes ${start}-${end}/${size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunk,
                'Content-Type': 'video/mp4'
            },
            data: stream.pipe(decipher)
        })
    })

    mainWindow.webContents.on('did-finish-load', () => {
        if (!filePath) {
            const res = dialog.showOpenDialogSync(mainWindow, {
                properties: ['openFile'],
                filters: [{
                        name: 'Secure Video',
                        extensions: ['sev']
                    }, {
                        name: 'All Files',
                        extensions: ['*']
                    }
                ]
            });
            if (res) 
                filePath = res[0];
            else {
                app.quit();
				return;
			}
        }

        mainWindow.webContents.executeJavaScript('document.querySelector("video").src = "http://video"');
    });

    mainWindow.on('close', () => {
        app.quit();
    });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.exit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    })

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', function () {
        createWindow();
    })
}

// To encrypt: openssl enc -aes-128-cbc -K 796f75666f756e64746869736c6d616f -iv 696b6e6577736f6d656f6e6577696c6c -in filename.mp4 -out filename.sev
