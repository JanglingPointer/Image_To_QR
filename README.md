# Image_2_QR
Generating QR Codes From Images

Demo: https://janglingpointer.github.io/Image_To_QR/

<img width="800" alt="ui_screenshot" src="https://github.com/user-attachments/assets/ba1b71bd-f9f9-4ebf-b736-cb5d68c39a34" />
<img width="800" alt="results" src="https://github.com/user-attachments/assets/fcb2996f-75f3-4313-ab6c-2dabdcdddcc8" />

<b>General Note:</b>
<br/>
Like all QR codes, the code can be created & scanned offline and has no expiration date.

<b>Note on Robustness:</b>
<br/>
As not all the pixels in the resulting image display data of the QR Code, the resulting code is a tiny bit "less robust" compared to a simple "boring" qr-code. But in my use cases they always worked nicely. Just try out the Examples.

<b>Thanks to:</b>
<br/>
https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js
<br>for providing the Base QR Code


<b>PS:</b> I'm new to OpenSource Development, so If I am doing something wrong, i'm happy to adapt.<br/>
<b>PS2:</b> There's also a <a href="https://play.google.com/store/apps/details?id=dev.janglingpointer.image_to_qr">barebones Android App</a>, that is just an offline view of the website.
