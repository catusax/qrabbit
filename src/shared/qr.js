import QRCode from 'qrcode'

export async function generateQrDataUrl(text) {
  const sourceText = typeof text === 'string' ? text : String(text ?? '')
  return QRCode.toDataURL(sourceText, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
  })
}
