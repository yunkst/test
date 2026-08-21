/**
 * 把姓与名拼接为完整姓名，并去除每个部分的首尾空白。
 */
export function formatName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim()
}
