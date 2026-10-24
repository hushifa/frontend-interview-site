var e={answerHtml:`<p><code>Intl.Segmenter</code> 可以按 grapheme、word 或 sentence 级别进行语言相关分割。它比直接按 UTF-16 code unit 或简单正则切割更适合处理 emoji、组合字符、中文和不同语言的词边界。</p>
<p>分割粒度要和业务语义一致：限制“用户看到的字符数”通常考虑 grapheme，搜索高亮可能需要 word，摘要截断还要考虑可读性和 HTML 边界。分割器不能自动解决翻译、断行和文本方向。</p>
<p>目标浏览器支持不一致时应准备降级方案，并明确降级在复杂 Unicode 文本上的限制。不要把返回的 segment 对象直接当成安全 HTML。</p>`};export{e as default};