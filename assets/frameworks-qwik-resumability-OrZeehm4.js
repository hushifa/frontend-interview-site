var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>服务端渲染的页面先显示出来，可是按钮点了没反应，要等浏览器下载完 JavaScript、把组件重新跑一遍才能用，这一步就是 Hydration。Qwik 的说法是，Hydration 在客户端把应用逻辑“重放”一遍；Qwik 则在服务端暂停执行，到客户端接着执行，这叫可恢复性。</p>
<p>Qwik 文档把 Hydration 要找回的东西分成三样：事件监听器、组件树和应用状态。为了找回它们，框架要下载页面上所有组件的代码，再执行模板。Qwik 在服务端渲染时把这三样都写进 HTML：监听器写成元素属性，属性里记着处理函数在哪个代码块、叫什么名字；组件边界和状态订阅关系也一起序列化。</p>
<p>所以浏览器启动时不用执行应用代码。一个叫 Qwikloader 的小脚本在全局装一个监听器，用户点击时读出属性，下载对应的代码块，执行那个函数。写代码时，<code>onClick$</code> 这类带 <code>$</code> 的写法就标出了能单独懒加载的边界。</p>
<p>代价是状态必须能序列化。Qwik 能处理循环引用、Date、Map、Set、Promise 和 DOM 引用，函数要包成 QRL 才行；普通类的实例和流就不行，这类数据只能放在客户端代码里生成。</p>
</blockquote>
<h2>Hydration 在浏览器里做了什么</h2>
<p>先回顾 Hydration。服务端渲染出的 HTML 只是一份静态的结果，里面没有事件监听，框架也不知道哪个 DOM 属于哪个组件、组件里的状态是什么。</p>
<p>Qwik 文档把要恢复的东西列成三项。第一是监听器，要找到每个事件处理函数，把它绑到对应的 DOM 节点上。第二是组件树，框架要重建内部的组件层级。第三是应用状态，服务端取到或存下的数据要还原。</p>
<p>为什么这一步慢？文档给了两个原因：页面上所有组件的代码都要下载，而且要执行模板，才能重新发现监听器在哪里、组件树长什么样。也就是说，哪怕用户只想点一个按钮，浏览器也要先把整页的组件代码跑一遍。Hydration 本身的概念和常见错误可以看<a href="/questions/render-hydration/">《Hydration mismatch 为什么发生，应该怎样修复？》</a>。</p>
<h2>Qwik 把这三样写进了 HTML</h2>
<p>Qwik 的思路是：既然服务端已经执行过一次，就把执行到一半的状态存下来，浏览器直接接着用。文档用的比喻是，把一个应用序列化，挪到另一台虚拟机上（从服务器到浏览器），从序列化的那一刻继续运行。</p>
<p>先看一个计数器：</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">import</span> { component$, useSignal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@builder.io/qwik&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">component$</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> count = <span class="hljs-title function_">useSignal</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>$=<span class="hljs-string">{()</span> =&gt;</span> count.value++}&gt;
      Increment {count.value}
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
  );
});
</code></pre></div>
<p>这段代码在服务端渲染后，按钮上不会绑真实的事件监听，而是带一个属性，文档里的示意是 <code>&lt;button on:click=&quot;./chunk.js#handler_symbol&quot;&gt;</code>，记着点击时要去哪个代码块找哪个函数。文档的原话是，这个属性包含了恢复应用所需的全部信息，不需要提前做任何事。</p>
<p>组件树和状态也是同样的处理方式。组件边界信息被序列化，Qwik 不加载组件代码也能重建组件层级，而且只在某个组件需要重新渲染时才去做。状态和组件之间的订阅关系也写进去了，所以 <code>count</code> 变化时，Qwik 知道该重新渲染哪个组件。文档还说明，任何组件都可以在父组件的代码不在场的情况下恢复。</p>
<h2>用户点击时发生了什么</h2>
<p>页面上有一个 Qwikloader 脚本。它不需要任何应用代码，只在全局装一个监听器，而不是给每个元素各装一个。</p>
<p>用户点击按钮时，Qwikloader 读出按钮上的属性，拿到代码块地址和函数名，下载这个代码块，执行对应的函数。函数改了 <code>count</code>，Qwik 根据序列化的订阅关系找到要重新渲染的组件。</p>
<p>那 <code>onClick$</code> 末尾的 <code>$</code> 是什么意思？Qwik 文档的说法是，<code>$</code> 后缀表示这里有一个懒加载的边界，告诉 Optimizer 和开发者这里会做特殊的转换。处理函数的代码在用户点击前不会进入 JavaScript 虚拟机执行。文档同时说明，浏览器会提前把代码取到缓存里，所以第一次点击不会因为下载变慢。</p>
<p>这也是 Qwik 文档强调的一点：懒加载是可恢复架构自然带来的结果。在其他框架里，懒加载往往要开发者自己拆分代码；在 Qwik 里，每个 <code>$</code> 都是一个现成的拆分点。</p>
<h2>和 Islands 有什么不同</h2>
<p>很多人会把 Qwik 和 Astro 的 Islands 放在一起比。Islands 的做法见<a href="/questions/frameworks-astro-islands/">《Astro Islands 架构怎样减少客户端 JavaScript？》</a>：页面大部分不发 JavaScript，标了 <code>client:*</code> 的组件作为岛屿，在浏览器里各自下载代码并完成 Hydration。所以 Islands 是在减少需要 Hydration 的范围，每个岛屿内部仍然要重放一遍。</p>
<p>Qwik 不需要开发者划分哪些组件要交互，它的做法是不做 Hydration，靠序列化的信息在事件发生时按需恢复。两者都想减少页面启动时要执行的 JavaScript，切入点不同。</p>
<h2>可恢复性的代价：状态必须能序列化</h2>
<p>要把状态写进 HTML，状态就得能被序列化。Qwik 文档列出了它能处理的类型：和 JSON 不同，它支持循环引用，还能序列化 DOM 引用、Promise、Date、<code>URL</code>、<code>Map</code> 和 <code>Set</code>；函数闭包要包成 QRL（也就是带 <code>$</code> 的写法）才能序列化。</p>
<p>它处理不了的有两类。一是类的实例，序列化以后 <code>instanceof</code> 和原型都会丢，Date、URL、Map、Set 这些内置类型除外。二是流。文档给的办法是，不能序列化的数据只在客户端代码里创建。</p>
<p>所以文档说 Qwik 应用要按“以 DOM 为中心”的方式写，而不是“以堆内存为中心”。习惯了把状态放在类实例里的写法，迁到 Qwik 时要调整。</p>
<h2>常见追问</h2>
<p><strong>可恢复性是不是意味着页面完全不需要 JavaScript？</strong></p>
<blockquote>
<p>不是。Qwikloader 还是要加载的，用户交互时对应的代码块也要下载执行。区别在于启动时不用执行应用代码，不用为了找回监听器和组件树把整页组件重跑一遍，代码按交互一块一块地加载。</p>
</blockquote>
<p><strong>用户第一次点击会不会因为下载代码而卡一下？</strong></p>
<blockquote>
<p>Qwik 文档提到，处理函数虽然要等点击时才执行，浏览器会提前把代码取到缓存里，所以第一次点击不会因为下载而变慢。可以把这理解为“下载”和“执行”分开了：代码可以提前到浏览器缓存，但只在需要时才执行。</p>
</blockquote>
<p><strong>组件里用了一个自定义类的实例当状态会怎样？</strong></p>
<blockquote>
<p>序列化以后它就不是那个类的实例了，<code>instanceof</code> 判断和原型上的方法都会丢失。Qwik 文档建议这类数据只在客户端代码里创建，或者把状态改成普通对象、Map、Set 这类能序列化的结构。</p>
</blockquote>`};export{e as default};