var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>上线后，<code>main.js</code> 想让浏览器缓存一年，但代码一改又要立刻拿到新文件。办法是把哈希写进文件名：内容变了文件名就变，HTML 引用新文件名，旧文件继续被缓存也没关系。</p>
<p>webpack 提供三种哈希。<code>[fullhash]</code> 是整次编译的哈希，任何一个文件改了，所有用它命名的文件都会变。<code>[chunkhash]</code> 按 chunk 算，包含这个 chunk 里的全部内容。<code>[contenthash]</code> 也按 chunk 算，但只算这个文件那一种内容类型，比如同一个 chunk 抽出来的 JS 和 CSS 各算各的。</p>
<p>所以长效缓存一般用 <code>[name].[contenthash].js</code>。再配合三件事：<code>runtimeChunk: &#x27;single&#x27;</code> 把运行时拆出去，<code>splitChunks</code> 把 <code>node_modules</code> 拆成 vendors，<code>moduleIds: &#x27;deterministic&#x27;</code> 让模块 ID 不随引入顺序变化。这样改业务代码时，vendors 的文件名保持不变。</p>
<p>要注意，带哈希的文件可以长期缓存，引用它们的 HTML 却不能，HTML 要每次协商，否则用户拿不到新文件名。</p>
</blockquote>
<h2>三种哈希分别按什么算</h2>
<p>webpack 文档的 <code>output.filename</code> 模板字符串表是这样分的：<code>[fullhash]</code> 属于编译级别，是“整次编译的完整哈希”，旧名字 <code>[hash]</code> 已废弃；<code>[chunkhash]</code> 是“chunk 的哈希，包含 chunk 的所有元素”；<code>[contenthash]</code> 是“chunk 的哈希，只包含这一种内容类型的元素”。</p>
<p>先看 <code>[fullhash]</code>。整次编译只有一个值，只要项目里任何一个模块改了，它就变。如果所有文件都用它命名，改一行业务代码，第三方库的文件名也跟着变，用户得重新下载全部文件，缓存等于没做。</p>
<p><code>[chunkhash]</code> 缩小到了 chunk。改了 <code>about</code> 页面的代码，只影响 <code>about</code> 这个 chunk，<code>main</code> 不受影响。可是一个 chunk 可能同时产出 JS 和 CSS，比如用 <code>mini-css-extract-plugin</code> 把样式抽成单独文件。<code>[chunkhash]</code> 包含 chunk 的所有元素，只改样式时，JS 文件的哈希也可能一起变。</p>
<p><code>[contenthash]</code> 再细一层，只算这个文件那种内容。只改 CSS，就只有 CSS 文件名变，JS 文件名不动。所以文档的缓存指南直接用 <code>[contenthash]</code>。</p>
<p>哈希长度可以写成 <code>[contenthash:8]</code>，默认 20 位，也能用 <code>output.hashDigestLength</code> 统一设置。</p>
<h2>只用 contenthash 为什么还不够</h2>
<p>缓存指南里有个现象：源码什么都没改，再构建一次，文件名还是可能变。原因是 webpack 会把运行时和 manifest 这些样板代码放进入口 chunk。运行时就是 webpack 加载、连接模块用的那段代码，manifest 记录了模块和 chunk 的对应关系，任何 chunk 变了，这段代码都可能变。</p>
<p>第二个现象更隐蔽：只在业务代码里新增一个模块，vendors 的文件名也变了。文档解释，这是因为模块 ID 按解析顺序分配（<code>moduleIds: &#x27;natural&#x27;</code>），新模块插进来，后面模块的 ID 都往后挪，vendors 里引用的 ID 变了，内容也就变了。</p>
<p>所以文档给出的完整配置是这样的：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = {
  <span class="hljs-attr">output</span>: {
    <span class="hljs-attr">filename</span>: <span class="hljs-string">&#x27;[name].[contenthash].js&#x27;</span>,
    <span class="hljs-attr">clean</span>: <span class="hljs-literal">true</span>,
  },
  <span class="hljs-attr">optimization</span>: {
    <span class="hljs-attr">moduleIds</span>: <span class="hljs-string">&#x27;deterministic&#x27;</span>,
    <span class="hljs-attr">runtimeChunk</span>: <span class="hljs-string">&#x27;single&#x27;</span>,
    <span class="hljs-attr">splitChunks</span>: {
      <span class="hljs-attr">cacheGroups</span>: {
        <span class="hljs-attr">vendor</span>: {
          <span class="hljs-attr">test</span>: <span class="hljs-regexp">/[\\\\/]node_modules[\\\\/]/</span>,
          <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;vendors&#x27;</span>,
          <span class="hljs-attr">chunks</span>: <span class="hljs-string">&#x27;all&#x27;</span>,
        },
      },
    },
  },
};
</code></pre></div>
<p><code>runtimeChunk: &#x27;single&#x27;</code> 把运行时拆成一个单独的 <code>runtime</code> 文件，所有 chunk 共用它。第三方库改动少，单独打进 <code>vendors</code>，业务代码频繁发版时它的文件名不变，用户不用重新下载。</p>
<p><code>moduleIds: &#x27;deterministic&#x27;</code> 让模块 ID 不随解析顺序变化。文档说明，<code>production</code> 模式默认就是 <code>&#x27;deterministic&#x27;</code>，<code>development</code> 模式默认是 <code>&#x27;named&#x27;</code>，两者在多次构建之间都稳定，显式写上是为了不依赖 <code>mode</code>。文档按这套配置构建两次，一次引入新模块、一次不引入，vendors 的文件名完全相同。</p>
<p>拆出去以后，改业务代码时 <code>main</code> 和 <code>runtime</code> 变化是正常的：<code>main</code> 内容变了，<code>runtime</code> 里记录的模块也变了，只有 <code>vendors</code> 保持不变。</p>
<h2>realContentHash 是做什么的</h2>
<p><code>[contenthash]</code> 受 <code>optimization.realContentHash</code> 影响。文档说明，开启后会在资源处理完以后再算一遍哈希，得到真正按最终内容计算的值；关掉时用内部数据计算，资源内容相同时哈希也可能不同。它在 <code>production</code> 模式默认开启，<code>development</code> 和 <code>none</code> 默认关闭。所以线上构建不用额外配置。</p>
<h2>文件名带了哈希，服务器怎么配缓存</h2>
<p>文件名带哈希以后，内容一变就是新地址，所以这些文件可以设置很长的强缓存。HTML 不同，它的地址不变，又负责引用最新的文件名，必须每次都回服务器确认。缓存头怎么写，见<a href="/questions/network-cache-control/">《Cache-Control 的 immutable、no-store 等指令怎样选？》</a>和<a href="/questions/http-cache/">《强缓存与协商缓存如何配合？》</a>。</p>
<h2>常见追问</h2>
<p><strong>开发环境要不要用 contenthash？</strong></p>
<blockquote>
<p>一般不用。开发服务器不需要应对浏览器的长期缓存，用 <code>[name].js</code> 就够了。<code>realContentHash</code> 在 <code>development</code> 模式默认也是关闭的。</p>
</blockquote>
<p><strong>为什么改了一个页面，其他 chunk 的文件名也变了？</strong></p>
<blockquote>
<p>先看运行时有没有拆出去，没拆的话运行时在入口 chunk 里，任何 chunk 变化都会带着它变。再看 <code>moduleIds</code> 是不是 <code>&#x27;natural&#x27;</code>，按解析顺序分配 ID 时，新增模块会让其他模块的 ID 跟着变。</p>
</blockquote>
<p><strong>哈希写在文件名里，还是写成查询参数 <code>?v=xxx</code>？</strong></p>
<blockquote>
<p>写在文件名里。webpack 的缓存指南就是用 <code>[name].[contenthash].js</code> 让内容变化体现在文件名上，新旧版本是两个不同的文件，可以同时存在于服务器上，发版时旧页面还能继续加载旧文件。</p>
</blockquote>`};export{e as default};