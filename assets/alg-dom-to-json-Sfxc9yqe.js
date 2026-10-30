var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>题目一般是给一段 <code>&lt;div id=&quot;app&quot;&gt;&lt;span class=&quot;title&quot;&gt;你好&lt;/span&gt;&lt;/div&gt;</code>，要求输出 <code>{ tag: &#x27;div&#x27;, attrs: { id: &#x27;app&#x27; }, children: [{ tag: &#x27;span&#x27;, attrs: { class: &#x27;title&#x27; }, children: [&#x27;你好&#x27;] }] }</code>，再写一个函数把它还原回 DOM。</p>
<p>转 JSON 用递归。先看 <code>nodeType</code>：1 是元素，3 是文本，8 是注释。元素节点记下标签名，遍历 <code>attributes</code> 把每个属性的名字和值存进对象，再对 <code>childNodes</code> 里的每个子节点递归；文本节点直接返回它的文字。</p>
<p>还原是反过来：遇到字符串就用 <code>document.createTextNode</code> 建文本节点，遇到对象就用 <code>document.createElement</code> 建元素，<code>setAttribute</code> 写回属性，再把子节点逐个建好 <code>appendChild</code> 进去。</p>
<p>要注意几个细节。<code>childNodes</code> 里除了元素，还有文本和注释，HTML 里的缩进换行也是文本节点，所以要约定哪些保留。<code>tagName</code> 在 HTML 文档里是大写的，要统一转成小写。JSON 只能存结构和属性，<code>addEventListener</code> 注册的监听、输入框当前输入的值这类运行时状态都存不下来。</p>
</blockquote>
<h2>手写 domToJson 和 jsonToDom</h2>
<p>示例在 Node.js 里运行，所以用一个模拟的 <code>document</code>，它只实现了两个函数用到的属性和方法。<code>domToJson</code> 只读 <code>nodeType</code>、<code>tagName</code>、<code>attributes</code>、<code>childNodes</code>、<code>textContent</code>，在浏览器里可以直接传入真实节点。看 <code>div</code> 里的换行文本和注释最后去了哪里。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">ELEMENT_NODE</span> = <span class="hljs-number">1</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">TEXT_NODE</span> = <span class="hljs-number">3</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">domToJson</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">if</span> (node.<span class="hljs-property">nodeType</span> === <span class="hljs-variable constant_">TEXT_NODE</span>) <span class="hljs-keyword">return</span> node.<span class="hljs-property">textContent</span>;
  <span class="hljs-keyword">const</span> json = { <span class="hljs-attr">tag</span>: node.<span class="hljs-property">tagName</span>.<span class="hljs-title function_">toLowerCase</span>(), <span class="hljs-attr">attrs</span>: {}, <span class="hljs-attr">children</span>: [] };
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> attr <span class="hljs-keyword">of</span> node.<span class="hljs-property">attributes</span>) json.<span class="hljs-property">attrs</span>[attr.<span class="hljs-property">name</span>] = attr.<span class="hljs-property">value</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> child <span class="hljs-keyword">of</span> node.<span class="hljs-property">childNodes</span>) {
    <span class="hljs-comment">// 注释节点不保留，只含空白的文本节点通常是缩进和换行，也跳过。</span>
    <span class="hljs-keyword">if</span> (child.<span class="hljs-property">nodeType</span> === <span class="hljs-variable constant_">TEXT_NODE</span> &amp;&amp; child.<span class="hljs-property">textContent</span>.<span class="hljs-title function_">trim</span>() === <span class="hljs-string">&#x27;&#x27;</span>) <span class="hljs-keyword">continue</span>;
    <span class="hljs-keyword">if</span> (child.<span class="hljs-property">nodeType</span> !== <span class="hljs-variable constant_">ELEMENT_NODE</span> &amp;&amp; child.<span class="hljs-property">nodeType</span> !== <span class="hljs-variable constant_">TEXT_NODE</span>) <span class="hljs-keyword">continue</span>;
    json.<span class="hljs-property">children</span>.<span class="hljs-title function_">push</span>(<span class="hljs-title function_">domToJson</span>(child));
  }
  <span class="hljs-keyword">return</span> json;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">jsonToDom</span>(<span class="hljs-params">json, doc</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> json === <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">return</span> doc.<span class="hljs-title function_">createTextNode</span>(json);
  <span class="hljs-keyword">const</span> el = doc.<span class="hljs-title function_">createElement</span>(json.<span class="hljs-property">tag</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, value] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(json.<span class="hljs-property">attrs</span> ?? {})) el.<span class="hljs-title function_">setAttribute</span>(name, value);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> child <span class="hljs-keyword">of</span> json.<span class="hljs-property">children</span> ?? []) el.<span class="hljs-title function_">appendChild</span>(<span class="hljs-title function_">jsonToDom</span>(child, doc));
  <span class="hljs-keyword">return</span> el;
}

<span class="hljs-comment">// 用来演示的模拟节点，只实现上面两个函数用到的属性和方法。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createFakeDocument</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">createTextNode</span>: <span class="hljs-function">(<span class="hljs-params">text</span>) =&gt;</span> ({ <span class="hljs-attr">nodeType</span>: <span class="hljs-variable constant_">TEXT_NODE</span>, <span class="hljs-attr">textContent</span>: text }),
    <span class="hljs-attr">createComment</span>: <span class="hljs-function">(<span class="hljs-params">text</span>) =&gt;</span> ({ <span class="hljs-attr">nodeType</span>: <span class="hljs-number">8</span>, <span class="hljs-attr">textContent</span>: text }),
    <span class="hljs-title function_">createElement</span>(<span class="hljs-params">tag</span>) {
      <span class="hljs-keyword">const</span> attrMap = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
      <span class="hljs-keyword">return</span> {
        <span class="hljs-attr">nodeType</span>: <span class="hljs-variable constant_">ELEMENT_NODE</span>,
        <span class="hljs-attr">tagName</span>: tag.<span class="hljs-title function_">toUpperCase</span>(),
        <span class="hljs-attr">childNodes</span>: [],
        <span class="hljs-keyword">get</span> <span class="hljs-title function_">attributes</span>() {
          <span class="hljs-keyword">return</span> [...attrMap].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[name, value]</span>) =&gt;</span> ({ name, value }));
        },
        <span class="hljs-title function_">setAttribute</span>(<span class="hljs-params">name, value</span>) { attrMap.<span class="hljs-title function_">set</span>(name, <span class="hljs-title class_">String</span>(value)); },
        <span class="hljs-title function_">appendChild</span>(<span class="hljs-params">child</span>) { <span class="hljs-variable language_">this</span>.<span class="hljs-property">childNodes</span>.<span class="hljs-title function_">push</span>(child); <span class="hljs-keyword">return</span> child; },
      };
    },
  };
}

<span class="hljs-keyword">const</span> doc = <span class="hljs-title function_">createFakeDocument</span>();
<span class="hljs-keyword">const</span> div = doc.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;div&#x27;</span>);
div.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;id&#x27;</span>, <span class="hljs-string">&#x27;app&#x27;</span>);
div.<span class="hljs-title function_">appendChild</span>(doc.<span class="hljs-title function_">createTextNode</span>(<span class="hljs-string">&#x27;\\n  &#x27;</span>));
<span class="hljs-keyword">const</span> span = doc.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;span&#x27;</span>);
span.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;class&#x27;</span>, <span class="hljs-string">&#x27;title&#x27;</span>);
span.<span class="hljs-title function_">appendChild</span>(doc.<span class="hljs-title function_">createTextNode</span>(<span class="hljs-string">&#x27;你好&#x27;</span>));
div.<span class="hljs-title function_">appendChild</span>(span);
div.<span class="hljs-title function_">appendChild</span>(doc.<span class="hljs-title function_">createComment</span>(<span class="hljs-string">&#x27;注释&#x27;</span>));
<span class="hljs-keyword">const</span> ul = doc.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;ul&#x27;</span>);
ul.<span class="hljs-title function_">appendChild</span>(doc.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;li&#x27;</span>));
div.<span class="hljs-title function_">appendChild</span>(ul);

<span class="hljs-keyword">const</span> json = <span class="hljs-title function_">domToJson</span>(div);
<span class="hljs-keyword">const</span> text = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(json);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(text); <span class="hljs-comment">// {&quot;tag&quot;:&quot;div&quot;,&quot;attrs&quot;:{&quot;id&quot;:&quot;app&quot;},&quot;children&quot;:[{&quot;tag&quot;:&quot;span&quot;,&quot;attrs&quot;:{&quot;class&quot;:&quot;title&quot;},&quot;children&quot;:[&quot;你好&quot;]},{&quot;tag&quot;:&quot;ul&quot;,&quot;attrs&quot;:{},&quot;children&quot;:[{&quot;tag&quot;:&quot;li&quot;,&quot;attrs&quot;:{},&quot;children&quot;:[]}]}]}</span>

<span class="hljs-keyword">const</span> rebuilt = <span class="hljs-title function_">jsonToDom</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(text), doc);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(rebuilt.<span class="hljs-property">tagName</span>); <span class="hljs-comment">// DIV</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(rebuilt.<span class="hljs-property">childNodes</span>[<span class="hljs-number">0</span>].<span class="hljs-property">childNodes</span>[<span class="hljs-number">0</span>].<span class="hljs-property">textContent</span>); <span class="hljs-comment">// 你好</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">domToJson</span>(rebuilt)) === text ? <span class="hljs-string">&#x27;same&#x27;</span> : <span class="hljs-string">&#x27;diff&#x27;</span>); <span class="hljs-comment">// same</span>
</code></pre></div>
<p><code>div</code> 里放了四个子节点：换行加空格的文本、<code>span</code>、注释和 <code>ul</code>，转出来的 <code>children</code> 只有 <code>span</code> 和 <code>ul</code> 两项。只含空白的文本节点被跳过了，注释的 <code>nodeType</code> 是 8，也被跳过了。</p>
<p>为什么默认要跳过空白文本？因为 MDN 说明 <code>childNodes</code> 包含元素、文本和注释，HTML 源码里为了排版写的缩进和换行，解析后都会变成文本节点。不跳过的话，JSON 里会塞满 <code>&quot;\\n  &quot;</code>。可是 <code>&lt;pre&gt;</code> 里的空白、两个行内元素之间的空格是有意义的，跳过就会改变显示效果，所以这条规则要和面试官确认，必要时对这类元素保留空白。</p>
<p>为什么标签名要转小写？MDN 写明，在 HTML 文档里 <code>tagName</code> 总是返回大写形式，<code>&lt;div&gt;</code> 读出来是 <code>&quot;DIV&quot;</code>。存成小写，JSON 更好读，也和写 HTML 的习惯一致。<code>createElement(&#x27;div&#x27;)</code> 在 HTML 文档里同样会得到 <code>DIV</code>，所以还原后 <code>rebuilt.tagName</code> 是 <code>DIV</code>。</p>
<p>最后一行把还原出来的 DOM 再转一次 JSON，结果和第一次一模一样，说明两个函数能互相还原。</p>
<h2>attributes 怎样遍历</h2>
<p><code>element.attributes</code> 返回的是 <code>NamedNodeMap</code>，不是数组，没有 <code>map</code>、<code>forEach</code>。MDN 的示例直接用 <code>for...of</code> 遍历它，每一项是一个 <code>Attr</code> 对象，有 <code>name</code> 和 <code>value</code>。所以代码写的是 <code>for (const attr of node.attributes)</code>。要用数组方法，就先 <code>Array.from(node.attributes)</code>。</p>
<p><code>attributes</code> 读到的是 HTML 特性，也就是写在标签上的那些。MDN 说明，<code>value</code> 特性对应的是 <code>defaultValue</code>，也就是输入框的初始值，用户输入的内容要从 <code>input.value</code> 读；<code>checked</code> 特性也只表示默认是否勾选，当前状态要读 <code>checked</code> 属性。题目要求“保存表单状态”时，要单独读这些属性存进 JSON。</p>
<h2>还原时要注意什么</h2>
<p><code>jsonToDom</code> 里，文本一律用 <code>createTextNode</code>。不要把 JSON 拼成 HTML 字符串再赋给 <code>innerHTML</code>，因为 JSON 如果来自接口或用户，文本里的 <code>&lt;img onerror=...&gt;</code> 会被当成标签解析执行，用 <code>createTextNode</code> 建出来的永远只是文本。</p>
<p>还原属性用 <code>setAttribute</code>，MDN 写明，在 HTML 文档里它会把属性名自动转成小写，值不是字符串时也会被转成字符串。所以 JSON 里的属性名大小写不影响结果。</p>
<p>如果 JSON 来自不可信的来源，还要考虑白名单：<code>on</code> 开头的属性，比如 <code>onclick</code>，写成特性以后就是一段会执行的脚本；<code>&lt;script&gt;</code>、<code>&lt;iframe&gt;</code> 这类标签也要拦住。</p>
<h2>常见追问</h2>
<p><strong>SVG 元素用这套代码有什么问题？</strong></p>
<blockquote>
<p>主要是命名空间。MDN 说明，在 HTML 里混用 SVG、MathML 时，要用 <code>createElementNS</code> 显式指定命名空间，SVG 元素要用 <code>document.createElementNS(&#x27;http://www.w3.org/2000/svg&#x27;, tag)</code> 创建，所以 JSON 里要记下节点的 <code>namespaceURI</code>。另外 SVG 有 <code>foreignObject</code> 这类带大写字母的标签名，一律转小写会改掉名字；而且 MDN 写明，在 HTML 文档里调用 <code>createElement</code> 会先把名字转成小写。</p>
</blockquote>
<p><strong>DOM 树很深会不会栈溢出？</strong></p>
<blockquote>
<p>递归深度等于树的深度，正常页面一般不会有问题。要处理极深的树，可以改用显式栈迭代，思路见<a href="/questions/alg-tree-traversal/">《菜单、目录这类多叉树怎样用显式栈做前序遍历？》</a>。</p>
</blockquote>`};export{e as default};