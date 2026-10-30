var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如表单配置是 <code>{ user: { name: &#x27;小明&#x27;, tags: [&#x27;a&#x27;] } }</code>，提交给后端要变成 <code>{ &#x27;user.name&#x27;: &#x27;小明&#x27;, &#x27;user.tags[0]&#x27;: &#x27;a&#x27; }</code>，这就是扁平化；反过来把带路径的键还原成嵌套对象，就是反扁平化。</p>
<p>扁平化用递归：遇到对象或数组就往下走，把当前路径传下去，对象的键用点号接上，数组的下标写成 <code>[0]</code>；遇到其他值，就是叶子，把它存到当前路径下。反扁平化把每个键拆成路径段，从根开始一层层往下，某一层不存在就新建，下一段是数字下标就建数组，否则建对象。</p>
<p>有两个边界最常被问。空对象和空数组没有任何叶子，递归时什么也不会写进结果，所以要单独把它们原样存下来，不然还原回去就少了这个字段。<code>null</code> 不是对象，要当叶子处理，不能往下递归。</p>
<p>还要注意安全。反扁平化的键如果来自用户输入，<code>&#x27;__proto__.isAdmin&#x27;</code> 这样的路径会把属性写到所有对象共享的原型上，所以要跳过 <code>__proto__</code>、<code>constructor</code>、<code>prototype</code> 这几个段。</p>
</blockquote>
<h2>手写 flatten 和 unflatten</h2>
<p>下面的代码分两半：<code>flatten</code> 递归遍历生成路径键，<code>unflatten</code> 拆开路径逐层还原。看 <code>e: {}</code> 和 <code>f: []</code> 在两边是怎么处理的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">isPlainObject</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">null</span> || <span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> proto = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(value);
  <span class="hljs-keyword">return</span> proto === <span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span> || proto === <span class="hljs-literal">null</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">flatten</span>(<span class="hljs-params">source</span>) {
  <span class="hljs-keyword">const</span> result = {};

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">walk</span>(<span class="hljs-params">value, path</span>) {
    <span class="hljs-keyword">const</span> isArray = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(value);
    <span class="hljs-keyword">if</span> (!isArray &amp;&amp; !<span class="hljs-title function_">isPlainObject</span>(value)) {
      result[path] = value;
      <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">const</span> keys = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(value);
    <span class="hljs-comment">// 空对象和空数组没有子键，原样保留，否则反扁平化时会丢掉它们。</span>
    <span class="hljs-keyword">if</span> (keys.<span class="hljs-property">length</span> === <span class="hljs-number">0</span> &amp;&amp; path !== <span class="hljs-string">&#x27;&#x27;</span>) {
      result[path] = isArray ? [] : {};
      <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> keys) {
      <span class="hljs-keyword">const</span> next = isArray ? <span class="hljs-string">\`<span class="hljs-subst">\${path}</span>[<span class="hljs-subst">\${key}</span>]\`</span> : path ? <span class="hljs-string">\`<span class="hljs-subst">\${path}</span>.<span class="hljs-subst">\${key}</span>\`</span> : key;
      <span class="hljs-title function_">walk</span>(value[key], next);
    }
  }

  <span class="hljs-title function_">walk</span>(source, <span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">FORBIDDEN</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;__proto__&#x27;</span>, <span class="hljs-string">&#x27;constructor&#x27;</span>, <span class="hljs-string">&#x27;prototype&#x27;</span>]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">parsePath</span>(<span class="hljs-params">path</span>) {
  <span class="hljs-keyword">const</span> segments = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> match <span class="hljs-keyword">of</span> path.<span class="hljs-title function_">matchAll</span>(<span class="hljs-regexp">/([^.[\\]]+)|\\[(\\d+)\\]/g</span>)) {
    segments.<span class="hljs-title function_">push</span>(match[<span class="hljs-number">2</span>] === <span class="hljs-literal">undefined</span> ? match[<span class="hljs-number">1</span>] : <span class="hljs-title class_">Number</span>(match[<span class="hljs-number">2</span>]));
  }
  <span class="hljs-keyword">return</span> segments;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">unflatten</span>(<span class="hljs-params">flat</span>) {
  <span class="hljs-keyword">const</span> root = {};
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [path, value] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(flat)) {
    <span class="hljs-keyword">const</span> segments = <span class="hljs-title function_">parsePath</span>(path);
    <span class="hljs-keyword">if</span> (segments.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> <span class="hljs-variable constant_">FORBIDDEN</span>.<span class="hljs-title function_">has</span>(s))) <span class="hljs-keyword">continue</span>;
    <span class="hljs-keyword">let</span> node = root;
    segments.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">segment, i</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (i === segments.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>) {
        node[segment] = value;
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-keyword">if</span> (node[segment] === <span class="hljs-literal">undefined</span>) {
        node[segment] = <span class="hljs-keyword">typeof</span> segments[i + <span class="hljs-number">1</span>] === <span class="hljs-string">&#x27;number&#x27;</span> ? [] : {};
      }
      node = node[segment];
    });
  }
  <span class="hljs-keyword">return</span> root;
}

<span class="hljs-keyword">const</span> data = { <span class="hljs-attr">a</span>: { <span class="hljs-attr">b</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">c</span>: [<span class="hljs-number">10</span>, { <span class="hljs-attr">d</span>: <span class="hljs-number">2</span> }] }, <span class="hljs-attr">e</span>: {}, <span class="hljs-attr">f</span>: [], <span class="hljs-attr">g</span>: <span class="hljs-literal">null</span> };
<span class="hljs-keyword">const</span> flat = <span class="hljs-title function_">flatten</span>(data);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(flat)); <span class="hljs-comment">// {&quot;a.b&quot;:1,&quot;a.c[0]&quot;:10,&quot;a.c[1].d&quot;:2,&quot;e&quot;:{},&quot;f&quot;:[],&quot;g&quot;:null}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">unflatten</span>(flat)) === <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(data) ? <span class="hljs-string">&#x27;same&#x27;</span> : <span class="hljs-string">&#x27;diff&#x27;</span>); <span class="hljs-comment">// same</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">unflatten</span>({ <span class="hljs-string">&#x27;list[1]&#x27;</span>: <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-string">&#x27;list[0]&#x27;</span>: <span class="hljs-string">&#x27;a&#x27;</span> }))); <span class="hljs-comment">// {&quot;list&quot;:[&quot;a&quot;,&quot;b&quot;]}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">unflatten</span>({ <span class="hljs-string">&#x27;__proto__.isAdmin&#x27;</span>: <span class="hljs-literal">true</span> }))); <span class="hljs-comment">// {}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>({}.<span class="hljs-property">isAdmin</span>)); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p><code>flatten</code> 的结果里，<code>a.c[0]</code> 和 <code>a.c[1].d</code> 说明数组用的是下标写法，对象用的是点号。<code>e</code> 和 <code>f</code> 被原样存成了 <code>{}</code> 和 <code>[]</code>，<code>g</code> 的 <code>null</code> 也作为叶子留了下来。再用 <code>unflatten</code> 还原，序列化后和原数据完全一样。</p>
<p>为什么空对象要单独判断？因为递归只在遇到叶子时才往结果里写。<code>{}</code> 没有任何键，<code>for</code> 循环一次都不执行，什么也不会留下，还原时这个字段就消失了。所以代码在“键为空且不是根”时，直接把一个新的空对象或空数组存进结果。根对象本身是空的时候，返回空结果就对了，所以要排除 <code>path === &#x27;&#x27;</code>。</p>
<p>为什么用 <code>isPlainObject</code> 判断，而不是 <code>typeof value === &#x27;object&#x27;</code>？因为 <code>typeof null</code> 也是 <code>&#x27;object&#x27;</code>，往下递归会报错。<code>Date</code>、<code>Map</code> 这类对象也是 <code>&#x27;object&#x27;</code>，可它们的数据不在可枚举属性里，<code>Object.keys(new Date())</code> 是空数组，按普通对象拆开就丢了。只有原型是 <code>Object.prototype</code> 或 <code>null</code> 的普通对象才往下拆，其他都当叶子。</p>
<h2>反扁平化时怎样决定建对象还是数组</h2>
<p><code>parsePath</code> 把 <code>&#x27;a.c[1].d&#x27;</code> 拆成 <code>[&#x27;a&#x27;, &#x27;c&#x27;, 1, &#x27;d&#x27;]</code>，方括号里的下标转成数字，点号分隔的键保留字符串。往下走时，如果下一层不存在，就看下一段的类型：是数字就建数组，是字符串就建对象。</p>
<p>第三个输出里，<code>list[1]</code> 比 <code>list[0]</code> 先出现。第一次处理 <code>list[1]</code> 时，下一段是数字 1，所以 <code>list</code> 建成数组，再写 <code>list[1] = &#x27;b&#x27;</code>，这时数组下标 0 还是空位。处理到 <code>list[0]</code> 时把空位补上，最后结果是 <code>[&quot;a&quot;,&quot;b&quot;]</code>。如果有的下标一直没有出现，数组里就会留下空位，这一点要和面试官确认需求。</p>
<p>这里约定只有方括号里的才算下标，<code>&#x27;a.0&#x27;</code> 里的 <code>0</code> 当作对象键。lodash 的 <code>set</code> 会把点号后的纯数字也当成下标，见<a href="/questions/alg-lodash-get-set/">《怎样手写 lodash 的 get 和 set？》</a>。两种约定都可以，重要的是 <code>flatten</code> 和 <code>unflatten</code> 用同一种，才能互相还原。</p>
<h2>为什么要过滤 <strong>proto</strong></h2>
<p>第四个输出里，键是 <code>&#x27;__proto__.isAdmin&#x27;</code>。如果不拦，第一段 <code>__proto__</code> 读到的是 <code>Object.prototype</code>，接着往上面写 <code>isAdmin = true</code>，以后所有普通对象都会“继承”到这个属性，这就是原型污染。代码里只要路径中有 <code>__proto__</code>、<code>constructor</code>、<code>prototype</code> 任何一段，就跳过整条，所以最后一行 <code>{}.isAdmin</code> 还是 <code>undefined</code>。原型污染的成因和更多防御办法见<a href="/questions/sec-prototype-pollution/">《原型污染为什么常出现在动态属性赋值和深合并中？》</a>。</p>
<h2>常见追问</h2>
<p><strong>键名本身含有点号怎么办，比如 <code>{ &#x27;a.b&#x27;: 1 }</code>？</strong></p>
<blockquote>
<p>扁平化后得到的键也是 <code>&#x27;a.b&#x27;</code>，和 <code>{ a: { b: 1 } }</code> 扁平化的结果撞在一起，还原时没法区分。要支持这种键，就得约定转义规则，比如把键里的点号写成 <code>\\.</code>，或者改用数组表示路径，比如 <code>[[&#x27;a.b&#x27;], 1]</code>。</p>
</blockquote>
<p><strong>对象里有循环引用会怎样？</strong></p>
<blockquote>
<p>递归会一直走下去，最后栈溢出。可以用一个 <code>WeakSet</code> 记录当前路径上已经访问过的对象，再次遇到时抛错或者跳过。处理循环引用的思路和深拷贝相同，见<a href="/questions/alg-deep-clone/">《怎样手写深拷贝？和 structuredClone 有什么区别？》</a>。</p>
</blockquote>`};export{e as default};