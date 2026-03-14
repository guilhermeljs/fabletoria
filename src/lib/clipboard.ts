/**
 * Copies text to the clipboard.
 *
 * Tries the modern Clipboard API first. Falls back to the legacy
 * execCommand approach for Firefox and non-secure contexts where
 * navigator.clipboard may be undefined.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
