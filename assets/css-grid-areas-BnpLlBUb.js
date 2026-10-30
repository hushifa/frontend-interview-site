var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如后台页面要有顶栏、侧边栏、主内容和底栏。用 <code>grid-template-areas</code> 可以把布局直接“画”出来：每个字符串是一行，里面每个名字是一个格子，<code>&quot;head head&quot; &quot;nav main&quot; &quot;foot foot&quot;</code> 就是顶栏和底栏横跨两列。子元素写 <code>grid-area: main</code>，就放进名为 <code>main</code> 的区域。</p>
<p>它有两条硬规则：每一行的格子数必须一样；同一个名字占的格子必须拼成一个实心矩形，不能是 L 形或者分成两块。违反任何一条，整条声明都会失效。不想放东西的格子用 <code>.</code> 占位。</p>
<p>好处是布局一眼就能看懂，改布局也只改这一处。手机上要把侧边栏挪到主内容下面，只要在媒体查询里换一组字符串，HTML 和子元素的样式都不用动。另外每个区域会自动生成 <code>名字-start</code> 和 <code>名字-end</code> 网格线，其他元素也能按这些线定位。</p>
<p>区域适合固定结构的页面骨架。商品卡片这种数量不定的列表，用 <code>repeat(auto-fill, minmax(200px, 1fr))</code> 让浏览器按容器宽度自动决定放几列，两者经常一起用：外层用区域分骨架，主内容里再用 <code>auto-fill</code> 排卡片。</p>
</blockquote>
<h2>先把布局画出来</h2>
<p>下面是一个三行两列的后台布局。每个字符串是一行，空格分开的每个名字是一列：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.layout</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">200px</span> <span class="hljs-number">1</span>fr;
  <span class="hljs-attribute">grid-template-rows</span>: <span class="hljs-number">56px</span> <span class="hljs-number">1</span>fr <span class="hljs-number">40px</span>;
  <span class="hljs-attribute">grid-template-areas</span>:
    <span class="hljs-string">&#x27;head head&#x27;</span>
    <span class="hljs-string">&#x27;nav  main&#x27;</span>
    <span class="hljs-string">&#x27;foot foot&#x27;</span>;
}

<span class="hljs-selector-class">.header</span> { <span class="hljs-attribute">grid-area</span>: head; }
<span class="hljs-selector-class">.sidebar</span> { <span class="hljs-attribute">grid-area</span>: nav; }
<span class="hljs-selector-class">.content</span> { <span class="hljs-attribute">grid-area</span>: main; }
<span class="hljs-selector-class">.footer</span> { <span class="hljs-attribute">grid-area</span>: foot; }
</code></pre></div>
<p>MDN 的说明是，每写一个字符串就创建一行，字符串里的每个格子创建一列。同一个名字在一行内或者相邻行里重复出现，这些格子就合成一个跨多格的区域。所以 <code>head</code> 在第一行写了两次，顶栏就横跨两列。</p>
<p>为什么 <code>nav  main</code> 中间有两个空格也没关系？规范规定格子之间只按空白分隔，多余的空白会被忽略，所以可以用空格把列对齐，方便阅读。</p>
<h2>哪些写法会让整个布局失效</h2>
<p>CSS Grid 规范对字符串有两条要求：所有字符串的格子数（包括用 <code>.</code> 表示的空格子）必须相同，并且至少有一个格子；一个名字如果跨多个格子，这些格子必须组成一个实心矩形。任何一条不满足，整条 <code>grid-template-areas</code> 声明就是无效的，浏览器会当作没写，子元素上的 <code>grid-area</code> 也就找不到区域了。</p>
<p>下面用一个函数模拟这两条检查，并算出每个区域占的网格线。网格线从 1 开始编号，第一列左边是第 1 条线：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseAreas</span>(<span class="hljs-params">rows</span>) {
  <span class="hljs-keyword">const</span> grid = rows.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">row</span>) =&gt;</span> row.<span class="hljs-title function_">trim</span>().<span class="hljs-title function_">split</span>(<span class="hljs-regexp">/\\s+/</span>));
  <span class="hljs-keyword">if</span> (grid.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">cells</span>) =&gt;</span> cells.<span class="hljs-property">length</span> !== grid[<span class="hljs-number">0</span>].<span class="hljs-property">length</span>)) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;invalid: column count&#x27;</span>;
  <span class="hljs-keyword">const</span> areas = {};
  grid.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">cells, r</span>) =&gt;</span> {
    cells.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">name, c</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (<span class="hljs-regexp">/^\\.+$/</span>.<span class="hljs-title function_">test</span>(name)) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">const</span> box = areas[name] || (areas[name] = { <span class="hljs-attr">r1</span>: r, <span class="hljs-attr">r2</span>: r, <span class="hljs-attr">c1</span>: c, <span class="hljs-attr">c2</span>: c, <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> });
      box.<span class="hljs-property">r1</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(box.<span class="hljs-property">r1</span>, r);
      box.<span class="hljs-property">r2</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(box.<span class="hljs-property">r2</span>, r);
      box.<span class="hljs-property">c1</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(box.<span class="hljs-property">c1</span>, c);
      box.<span class="hljs-property">c2</span> = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(box.<span class="hljs-property">c2</span>, c);
      box.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
    });
  });
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, b] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(areas)) {
    <span class="hljs-keyword">if</span> ((b.<span class="hljs-property">r2</span> - b.<span class="hljs-property">r1</span> + <span class="hljs-number">1</span>) * (b.<span class="hljs-property">c2</span> - b.<span class="hljs-property">c1</span> + <span class="hljs-number">1</span>) !== b.<span class="hljs-property">count</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;invalid: &#x27;</span> + name;
  }
  <span class="hljs-keyword">const</span> result = {};
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, b] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(areas)) {
    result[name] = <span class="hljs-string">\`<span class="hljs-subst">\${b.r1 + <span class="hljs-number">1</span>}</span> / <span class="hljs-subst">\${b.c1 + <span class="hljs-number">1</span>}</span> / <span class="hljs-subst">\${b.r2 + <span class="hljs-number">2</span>}</span> / <span class="hljs-subst">\${b.c2 + <span class="hljs-number">2</span>}</span>\`</span>;
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">const</span> layout = <span class="hljs-title function_">parseAreas</span>([<span class="hljs-string">&#x27;head head&#x27;</span>, <span class="hljs-string">&#x27;nav  main&#x27;</span>, <span class="hljs-string">&#x27;foot foot&#x27;</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(layout.<span class="hljs-property">head</span>); <span class="hljs-comment">// 1 / 1 / 2 / 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(layout.<span class="hljs-property">main</span>); <span class="hljs-comment">// 2 / 2 / 3 / 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseAreas</span>([<span class="hljs-string">&#x27;a a&#x27;</span>, <span class="hljs-string">&#x27;a b&#x27;</span>, <span class="hljs-string">&#x27;c c&#x27;</span>])); <span class="hljs-comment">// invalid: a</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseAreas</span>([<span class="hljs-string">&#x27;a b c&#x27;</span>, <span class="hljs-string">&#x27;a b&#x27;</span>])); <span class="hljs-comment">// invalid: column count</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(<span class="hljs-title function_">parseAreas</span>([<span class="hljs-string">&#x27;. head&#x27;</span>, <span class="hljs-string">&#x27;nav main&#x27;</span>])).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// head,nav,main</span>
</code></pre></div>
<p><code>head</code> 的结果 <code>1 / 1 / 2 / 3</code> 和 <code>grid-area</code> 的写法一样，依次是行开始线、列开始线、行结束线、列结束线，也就是从第 1 条行线到第 2 条，横跨第 1 到第 3 条列线。</p>
<p>第三行里 <code>a</code> 占了左上、右上、左中三个格子，拼起来是 L 形，不是矩形，所以无效。第四行第二个字符串少了一个格子，也无效。最后一行的 <code>.</code> 是空格子，不会生成区域，所以只有三个名字。</p>
<p>规范还说明，以后的版本可能会允许非矩形或者不连续的区域，但目前的规范不允许。</p>
<h2>区域名还能当作网格线名用</h2>
<p>规范规定，每个命名区域 <code>foo</code> 会自动生成四条隐式的线名：行方向和列方向的开始线都叫 <code>foo-start</code>，结束线都叫 <code>foo-end</code>。它们和手写的线名一样可以用来定位，只是不会出现在 <code>grid-template-columns</code> 的值里。</p>
<p>所以一个浮在主内容右上角的提示条，不用写数字，也能对齐到 <code>main</code> 区域：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.notice</span> {
  <span class="hljs-attribute">grid-column</span>: main-start / main-end;
  <span class="hljs-attribute">grid-row</span>: main-start;
}
</code></pre></div>
<p>反过来也成立：子元素写 <code>grid-area: main</code> 能生效，是因为浏览器按名字找到了 <code>main-start</code> 和 <code>main-end</code> 这几条线。</p>
<h2>怎样在手机上换布局</h2>
<p>区域的好处在响应式时最明显。窄屏上去掉侧边栏那一列，把导航放到主内容上面，只改容器上的三条属性：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">max-width</span>: <span class="hljs-number">640px</span>) {
  <span class="hljs-selector-class">.layout</span> {
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">1</span>fr;
    <span class="hljs-attribute">grid-template-rows</span>: <span class="hljs-number">56px</span> auto <span class="hljs-number">1</span>fr <span class="hljs-number">40px</span>;
    <span class="hljs-attribute">grid-template-areas</span>:
      <span class="hljs-string">&#x27;head&#x27;</span>
      <span class="hljs-string">&#x27;nav&#x27;</span>
      <span class="hljs-string">&#x27;main&#x27;</span>
      <span class="hljs-string">&#x27;foot&#x27;</span>;
  }
}
</code></pre></div>
<p>子元素上的 <code>grid-area</code> 一个都没改，HTML 也没动，它们按名字自动落到新的位置上。</p>
<p>要注意，这样改的只是视觉位置，读屏软件和 Tab 键还是按 HTML 源码的顺序走。如果视觉顺序和源码顺序差得太多，键盘用户会觉得焦点在乱跳，所以源码顺序本身应该是合理的阅读顺序。</p>
<h2>卡片列表怎样让列数自动变化</h2>
<p>区域适合结构固定的骨架。主内容里的商品卡片数量不定，屏幕宽就多放几列，窄就少放几列，这时用 <code>repeat()</code> 配合 <code>auto-fill</code> 和 <code>minmax()</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.cards</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fill, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">200px</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">16px</span>;
}
</code></pre></div>
<p>意思是每列至少 200px、最多平分剩余空间，在不溢出的前提下尽量多放列。容器从 1000px 缩到 500px，列数会自动从 4 列变成 2 列，不需要写媒体查询。</p>
<p><code>auto-fit</code> 规则一样，区别只在项目少、放不满一行的时候：<code>auto-fill</code> 把空列留着，<code>auto-fit</code> 把空列收成 0 宽，让已有的项目拉宽铺满。两者的细节和 <code>1fr</code> 导致横向滚动条的问题，见<a href="/questions/css-grid-sizing/">《Grid 的 fr、minmax、auto-fit 和 auto-fill 如何使用？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>grid-template-areas</code> 和直接写 <code>grid-row</code>、<code>grid-column</code> 数字有什么区别？</strong></p>
<blockquote>
<p>效果一样，因为区域名最终也是转换成网格线来定位的。区别在维护：数字分散写在每个子元素上，改布局要改很多处；区域把整个布局集中写在容器上，看字符串就知道长什么样，响应式时也只改容器。</p>
</blockquote>
<p><strong>两个子元素写了同一个 <code>grid-area</code> 会怎样？</strong></p>
<blockquote>
<p>它们会被放进同一块区域，互相重叠，后面的盖在前面的上面，可以用 <code>z-index</code> 调整。区域名只描述网格里的位置，并不限制只能放一个元素。</p>
</blockquote>
<p><strong>什么时候用 Grid，什么时候用 Flex？</strong></p>
<blockquote>
<p>要同时控制行和列、让不同行的同一列对齐时用 Grid；一行里的元素按内容宽度依次排开时用 Flex。详细的比较见<a href="/questions/css-flex-grid/">《Flexbox 和 Grid 应该如何选择？》</a>。</p>
</blockquote>`};export{e as default};