var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>线上代码压缩以后，报错只会告诉你“第 1 行第 27 列”。Source Map 是一个 JSON 文件，里面的 mappings 字段像一张对照表，记录压缩后代码的每一段对应哪个源文件、哪一行、哪一列，原来叫什么名字。</p>
<p>这张表按规范分两层组织：分号隔开生成文件的每一行，逗号隔开一行里的每个片段，每个片段有 1、4 或 5 个数字，分别是生成列号、源文件下标、源码行号、源码列号和原名下标。</p>
<p>为了让文件变小，数字存的是相对前一个值的差值，再用 Base64 VLQ 编码：每个字符 6 位，最高位表示后面还有没有字符，第一个字符的最低位表示正负。所以小数字只占一个字母。</p>
<p>要注意，sourcesContent 字段放的是源码全文，公开部署映射文件就等于公开源码；线上怎样只给监控平台用，是另一个问题。</p>
</blockquote>
<h2>Source Map 是怎样还原位置的</h2>
<p>先看一段压缩后的代码，末尾的注释告诉浏览器去哪里找映射文件。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// app.3f9a.js（压缩后）</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">n</span>(<span class="hljs-params">t</span>){<span class="hljs-keyword">return</span> t.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">r</span>=&gt;</span>r*<span class="hljs-number">2</span>)}
<span class="hljs-comment">//# sourceMappingURL=app.3f9a.js.map</span>
</code></pre></div>
<p>映射文件大致长这样：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;version&quot;: 3,
  &quot;file&quot;: &quot;app.3f9a.js&quot;,
  &quot;sources&quot;: [&quot;src/math.ts&quot;],
  &quot;sourcesContent&quot;: [&quot;export function double(list: number[]) { ... }&quot;],
  &quot;names&quot;: [&quot;double&quot;, &quot;list&quot;, &quot;item&quot;],
  &quot;mappings&quot;: &quot;AAAA,SAASA,EAAOC,...&quot;
}
</code></pre></div>
<p><code>sources</code> 列出源文件，<code>names</code> 列出原来的变量名。<code>mappings</code> 是一串经过 Base64 VLQ 编码的数据，记录“生成代码的某个位置，对应第几个源文件的第几行第几列、原名是什么”。</p>
<h2>mappings 这串字母是怎样组织的</h2>
<p>ECMA-426 规范规定了 <code>mappings</code> 的结构：分号 <code>;</code> 隔开生成文件的每一行，逗号 <code>,</code> 隔开同一行里的每个片段（segment），每个片段由 1、4 或 5 个数字组成。</p>
<p>这几个数字依次是：生成代码里的列号；源文件在 <code>sources</code> 里的下标；源码里的行号；源码里的列号；变量原名在 <code>names</code> 里的下标。全部从 0 开始计数。只有 1 个数字的片段表示这段生成代码没有对应的源码，有 5 个数字时才带原名。</p>
<p>为什么不直接写 <code>0,0,2,11,2</code> 这样的明文数字？因为一个压缩文件有成千上万个片段，明文太占地方。所以规范用了两个办法压缩体积。</p>
<p>第一个办法是存差值。生成列号相对同一行上一个片段，每到新的一行重新从 0 算；其余几个字段相对它在前面最后一次出现的值，跨行也不重置。相邻片段的位置通常很接近，差值是很小的数字。</p>
<p>第二个办法是 Base64 VLQ 编码，把小数字变成很短的字符。</p>
<h2>Base64 VLQ 怎样把数字变成字母</h2>
<p>VLQ 是“可变长度数量”，小数字占一个字符，大数字占几个字符。规范的定义是：每个 Base64 字符代表 6 位，最高位（第 6 位）是继续位，为 1 表示后面还有字符；剩下 5 位存数值，先存低位；第一个字符的最低位是符号位，为 1 表示负数。</p>
<p>下面按这个定义写一个解码函数，看看样例里的片段代表什么：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> chars = <span class="hljs-string">&#x27;ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">decodeSegment</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">const</span> values = [];
  <span class="hljs-keyword">let</span> value = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> shift = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> ch <span class="hljs-keyword">of</span> text) {
    <span class="hljs-keyword">const</span> digit = chars.<span class="hljs-title function_">indexOf</span>(ch);
    value += (digit &amp; <span class="hljs-number">31</span>) &lt;&lt; shift;
    <span class="hljs-keyword">if</span> (digit &amp; <span class="hljs-number">32</span>) {
      shift += <span class="hljs-number">5</span>;
    } <span class="hljs-keyword">else</span> {
      values.<span class="hljs-title function_">push</span>(value &amp; <span class="hljs-number">1</span> ? -(value &gt;&gt; <span class="hljs-number">1</span>) : value &gt;&gt; <span class="hljs-number">1</span>);
      value = <span class="hljs-number">0</span>;
      shift = <span class="hljs-number">0</span>;
    }
  }
  <span class="hljs-keyword">return</span> values;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">decodeSegment</span>(<span class="hljs-string">&#x27;AAAA&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,0,0,0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">decodeSegment</span>(<span class="hljs-string">&#x27;SAASA&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 9,0,0,9,0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">decodeSegment</span>(<span class="hljs-string">&#x27;D&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// -1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">decodeSegment</span>(<span class="hljs-string">&#x27;gB&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 16</span>
</code></pre></div>
<p><code>AAAA</code> 是第一个片段，四个数都是 0：生成代码第 0 列，对应第 0 个源文件第 0 行第 0 列。<code>SAASA</code> 是差值，意思是往后挪 9 列，源码列也往后挪 9 列，并带上 <code>names</code> 里的第 0 个名字。</p>
<p><code>D</code> 为什么是 -1？<code>D</code> 在字母表里是 3，二进制 <code>000011</code>，继续位是 0，最低位 1 表示负数，去掉符号位剩下 1，所以是 -1。<code>gB</code> 是两个字符：<code>g</code> 是 32，继续位为 1、数值位为 0；<code>B</code> 是 1，左移 5 位得到 32，再去掉符号位就是 16。</p>
<p>所以浏览器查找一个报错位置时，就按行、按片段把差值累加起来，找到这一列对应的源文件、行列号和原名。</p>
<h2>浏览器从哪里找到映射文件</h2>
<p>ECMA-426 规定了两个入口：产物末尾的 <code>//# sourceMappingURL=</code> 注释，或者 <code>SourceMap</code> 响应头。两者都有时以响应头为准。</p>
<p><code>sourcesContent</code> 里放的是源码全文，所以公开部署带 <code>sourcesContent</code> 的映射文件，等于公开源码。生产环境怎样生成 hidden source map、按版本上传给监控平台还原堆栈、又不把映射文件公开，见<a href="/questions/monitoring-source-map/">《线上报错怎样用 Source Map 还原，又不把 map 文件公开？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么 DevTools 里还原出来的行号是偏的？</strong></p>
<blockquote>
<p>可能是某个构建插件改写代码时，没有生成或传递 Source Map，中间断了一环。也可能部署的 <code>.map</code> 来自另一次构建，跟产物对不上。</p>
</blockquote>
<p><strong>为什么列号要从同一行重新算，其他字段却不重置？</strong></p>
<blockquote>
<p>规范就是这样定义的：生成列号在每个分号之后重新从整数值开始，源文件下标、源码行列号和原名下标则一直相对上一次出现的值。规范没有解释原因；实际效果是每行开头的列号是个小整数，源码位置则能接着上一行的值算差值。</p>
</blockquote>`};export{e as default};