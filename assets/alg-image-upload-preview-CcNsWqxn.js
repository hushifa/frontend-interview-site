var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在 <code>&lt;input type=&quot;file&quot;&gt;</code> 里选了一张头像，上传之前想先在页面上看到。拿到 <code>input.files[0]</code> 这个 File 对象以后，有两种办法把它变成 <code>img</code> 能显示的地址。</p>
<p>第一种是 <code>URL.createObjectURL(file)</code>，它直接返回一个 <code>blob:</code> 开头的短地址，指向浏览器内存里的这份文件，同步返回，不用先把文件读完。第二种是 <code>FileReader</code> 的 <code>readAsDataURL(file)</code>，它把整个文件读出来编码成 base64，读完后在 <code>load</code> 事件里从 <code>reader.result</code> 拿到 <code>data:image/png;base64,...</code> 这样的长字符串。</p>
<p>所以单纯预览一般用 object URL，又快又省事。data URL 是普通字符串，不用释放，需要把图片存进 localStorage、或者把 base64 交给别的接口时才用它。</p>
<p>要注意 object URL 只要还存在，它指向的数据就不能被回收，所以换图、删除预览或组件卸载时要调用 <code>URL.revokeObjectURL()</code>。也别在图片 <code>load</code> 后马上释放，MDN 提醒那样用户就没法右键保存或在新标签打开这张图了。</p>
</blockquote>
<h2>用 object URL 预览，并在换图时释放</h2>
<p>下面把“生成地址”和“释放上一个地址”封装起来。<code>urlApi</code> 在浏览器里传全局的 <code>URL</code>；示例在 Node 里传一个假的对象，记录哪些地址被释放了。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createPreviewer</span>(<span class="hljs-params">urlApi</span>) {
  <span class="hljs-keyword">let</span> currentUrl = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">show</span>(<span class="hljs-params">file</span>) {
      <span class="hljs-comment">// 换图前释放上一张，否则旧图片的数据一直不能被回收。</span>
      <span class="hljs-keyword">if</span> (currentUrl) urlApi.<span class="hljs-title function_">revokeObjectURL</span>(currentUrl);
      currentUrl = urlApi.<span class="hljs-title function_">createObjectURL</span>(file);
      <span class="hljs-keyword">return</span> currentUrl;
    },
    <span class="hljs-title function_">clear</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">if</span> (currentUrl) urlApi.<span class="hljs-title function_">revokeObjectURL</span>(currentUrl);
      currentUrl = <span class="hljs-literal">null</span>;
    },
  };
}

<span class="hljs-keyword">const</span> revoked = [];
<span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> fakeUrlApi = {
  <span class="hljs-attr">createObjectURL</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-string">\`blob:demo-<span class="hljs-subst">\${++count}</span>\`</span>,
  <span class="hljs-attr">revokeObjectURL</span>: <span class="hljs-function">(<span class="hljs-params">url</span>) =&gt;</span> revoked.<span class="hljs-title function_">push</span>(url),
};

<span class="hljs-keyword">const</span> previewer = <span class="hljs-title function_">createPreviewer</span>(fakeUrlApi);
<span class="hljs-keyword">const</span> file = <span class="hljs-keyword">new</span> <span class="hljs-title class_">File</span>([<span class="hljs-string">&#x27;fake&#x27;</span>], <span class="hljs-string">&#x27;a.png&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;image/png&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(previewer.<span class="hljs-title function_">show</span>(file)); <span class="hljs-comment">// blob:demo-1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(previewer.<span class="hljs-title function_">show</span>(file)); <span class="hljs-comment">// blob:demo-2</span>
previewer.<span class="hljs-title function_">clear</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(revoked.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// blob:demo-1,blob:demo-2</span>
</code></pre></div>
<p>同一个文件 <code>show</code> 了两次，得到两个不同的地址。这和 MDN 的说法一致：每调用一次 <code>createObjectURL()</code> 都会生成一个新地址，即使是同一个对象。所以不能指望“同一张图只占一份”，每个地址都要各自释放。</p>
<p>为什么非释放不可？MDN 写明，只要还有一个 object URL 有效，它背后的数据就不能被垃圾回收。浏览器会在文档卸载时自动释放，可是单页应用里页面一直不卸载，用户反复换图，旧图片就一直占着内存。所以 <code>show</code> 里先释放上一个，<code>clear</code> 在删除预览或组件卸载时调用。</p>
<p>在浏览器里接上文件选择框是这样的：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> previewer = <span class="hljs-title function_">createPreviewer</span>(<span class="hljs-variable constant_">URL</span>);

input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> file = input.<span class="hljs-property">files</span>?.[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">if</span> (!file || !file.<span class="hljs-property">type</span>.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;image/&#x27;</span>)) <span class="hljs-keyword">return</span>;
  preview.<span class="hljs-property">src</span> = previewer.<span class="hljs-title function_">show</span>(file);
});
</code></pre></div>
<h2>用 FileReader 读成 data URL</h2>
<p><code>readAsDataURL</code> 没有返回值，读取是异步的，结果要在事件里拿：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> reader = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FileReader</span>();
reader.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;load&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  preview.<span class="hljs-property">src</span> = reader.<span class="hljs-property">result</span>; <span class="hljs-comment">// data:image/png;base64,...</span>
});
reader.<span class="hljs-title function_">readAsDataURL</span>(file);
</code></pre></div>
<p>为什么预览大图时不推荐它？因为它要把整个文件读完、编码成 base64 才能显示，base64 每 3 个字节变成 4 个字符，字符串比原文件大约三分之一。而 object URL 同步返回一个很短的地址，图片数据由浏览器直接加载。</p>
<p>可是 data URL 也有自己的好处：它就是一个字符串，不依赖当前文档，不用手动释放，可以存起来下次再用。MDN 还提醒，<code>reader.result</code> 开头带着 <code>data:image/png;base64,</code> 这样的声明，只要 base64 部分时要先把逗号前面的去掉。</p>
<h2>两种方式怎么选</h2>
<p>只是上传前看一眼，用 object URL。要把图片存进本地存储、塞进 JSON 发给只收 base64 的接口，用 data URL。要读文件的原始字节做处理，比如计算哈希、裁剪压缩，用 <code>file.arrayBuffer()</code> 或者把图片画到 Canvas 上，这两种地址都不是必需的。File、Blob 本身的关系见<a href="/questions/api-files/">《File、Blob 和 object URL 怎样用于文件预览？》</a>。</p>
<h2>常见追问</h2>
<p><strong>图片太大，想压缩后再上传怎么办？</strong></p>
<blockquote>
<p>可以先把图片画到 Canvas 上缩小，再用 <code>canvas.toBlob()</code> 生成一个新的 Blob 上传。预览只是给用户看的，真正上传什么文件由你决定。</p>
</blockquote>
<p><strong>前端检查了 <code>file.type</code>，服务端还要校验吗？</strong></p>
<blockquote>
<p>要。<code>file.type</code> 是浏览器给出的类型，通常根据扩展名推断，改个扩展名就能骗过去。前端检查只用来提示用户，服务端必须按文件内容重新校验。</p>
</blockquote>
<p><strong>React 组件里怎样释放 object URL？</strong></p>
<blockquote>
<p>在 <code>useEffect</code> 里根据当前文件创建地址，返回的清理函数里调用 <code>URL.revokeObjectURL</code>。换文件时旧的 effect 被清理，组件卸载时也会清理，就不会漏掉。</p>
</blockquote>`};export{e as default};