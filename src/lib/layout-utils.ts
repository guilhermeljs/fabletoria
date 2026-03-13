export function calculateNodeSize(
  text: string,
  ratio: number,
  maxWidth: number
): { width: number; height: number } {
  // Largura estimada do texto
  const charCount = text.length
  const calculatedWidth = charCount * ratio
  const width = Math.min(calculatedWidth, maxWidth)

  // Número de caracteres por linha
  const charsPerLine = Math.max(Math.floor(width / ratio), 1)
  const lines = Math.ceil(charCount / charsPerLine)

  // Altura exata para caber todas as linhas
  const lineHeight = 24
  const padding = 20 // padding superior + inferior
  const height = lines * lineHeight + padding

  return { width, height }
}
