import puppeteer, { PDFOptions } from 'puppeteer'
import { Readable } from 'stream'

export async function convertHtmlToPdf(html: string, options: PDFOptions | undefined): Promise<Readable> {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()

  await page.setContent(html, { waitUntil: 'domcontentloaded' })

  const stream = await page.createPDFStream(options)

  stream.on('end', async () => {
    await page.close()
    await browser.close()
  })

  return stream
}
