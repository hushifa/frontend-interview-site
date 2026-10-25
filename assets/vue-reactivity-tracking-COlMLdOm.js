var e={answerHtml:`<p>Vue 需要知道“哪个计算使用了哪个响应式值”，才能在值变化后找到相关工作。这个关系通常是在执行过程中通过实际读取建立的，不是先扫描函数源码，把里面出现过的所有名字都永久登记。</p>
<p>reactive 对象通过 Proxy 拦截相关操作，ref 则通过 value 访问机制参与追踪。只有在相应的响应式作用执行期间读取，才能把这次读取与那个作用关联起来。</p>
<h3>分支决定这一轮真正依赖什么</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { nextTick, reactive, ref, watchEffect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">useLeft</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">left</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">right</span>: <span class="hljs-number">10</span> });
<span class="hljs-keyword">const</span> seen = [];
<span class="hljs-keyword">const</span> stop = <span class="hljs-title function_">watchEffect</span>(<span class="hljs-function">() =&gt;</span> {
  seen.<span class="hljs-title function_">push</span>(state.<span class="hljs-property">useLeft</span> ? state.<span class="hljs-property">left</span> : state.<span class="hljs-property">right</span>);
});

state.<span class="hljs-property">right</span> = <span class="hljs-number">20</span>;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(seen.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1</span>

state.<span class="hljs-property">left</span> = <span class="hljs-number">2</span>;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(seen.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2</span>

state.<span class="hljs-property">useLeft</span> = <span class="hljs-literal">false</span>;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(seen.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,20</span>

state.<span class="hljs-property">left</span> = <span class="hljs-number">3</span>;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(seen.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,20</span>
<span class="hljs-title function_">stop</span>();
</code></pre></div>
<p>第一次执行时读取 useLeft 和 left，没有读取 right，所以只改 right 不需要重新运行这个作用。切换分支后，执行读取了 right，旧的 left 关系不应继续作为当前作用的有效依赖。</p>
<p>因此响应式系统必须处理依赖重新收集与旧关系清理，不是把首次收集的属性永久记在一个列表里。嵌套计算也需要正确维护当前追踪上下文，否则内外层依赖会混在一起。</p>
<h3>可以怎样理解内部关系</h3>
<p>概念上可以把它理解成“原始目标对象、访问的属性或操作、订阅它的作用”之间的关联。读取时登记，相关写入时通知，再由调度器决定怎样执行更新。</p>
<p>教学中常用 WeakMap、Map、Set 画这张关系图，但真实 Vue 版本还会采用自己的依赖节点、版本记录与优化方式。理解数据流比把某一段简化 track/trigger 代码当成完整源码更重要。</p>
<p>computed、watch、watchEffect 和组件渲染都会利用相关依赖机制，但它们不是同一种任务。computed 还涉及惰性求值与缓存，watch 有显式源与回调，组件更新则要生成并提交 DOM 变化。</p>
<h3>通知不等于每次赋值都立即刷新 DOM</h3>
<p>继续使用前面的导入：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> count = <span class="hljs-title function_">ref</span>(<span class="hljs-number">0</span>);
<span class="hljs-keyword">const</span> observations = [];
<span class="hljs-keyword">const</span> stopCount = <span class="hljs-title function_">watchEffect</span>(<span class="hljs-function">() =&gt;</span> {
  observations.<span class="hljs-title function_">push</span>(count.<span class="hljs-property">value</span>);
});

count.<span class="hljs-property">value</span> = <span class="hljs-number">1</span>;
count.<span class="hljs-property">value</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count.<span class="hljs-property">value</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(observations.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,2</span>
<span class="hljs-title function_">stopCount</span>();
</code></pre></div>
<p>响应式值本身已经是 2，但默认侦听调度会合并同一轮中的相关工作，最终执行时读取最新值。不能据此说状态赋值还没有发生，也不能把每一次赋值都等同于一次完整组件渲染。</p>
<p>同步侦听、默认侦听和提交后侦听有不同执行时机，应按用途选择。批处理可以减少重复执行，但不会帮你自动决定某个业务过程是否需要记录中间每一步变化。</p>
<h3>通过原对象写入，可能绕过通知入口</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> raw = { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> };
<span class="hljs-keyword">const</span> proxy = <span class="hljs-title function_">reactive</span>(raw);
<span class="hljs-keyword">let</span> runs = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> stopRaw = <span class="hljs-title function_">watchEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">void</span> proxy.<span class="hljs-property">count</span>;
  runs += <span class="hljs-number">1</span>;
});

raw.<span class="hljs-property">count</span> = <span class="hljs-number">1</span>;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(runs); <span class="hljs-comment">// 1</span>

proxy.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(runs); <span class="hljs-comment">// 2</span>
<span class="hljs-title function_">stopRaw</span>();
</code></pre></div>
<p>两者关联同一底层数据，但直接改 raw 没有经过 Proxy 的写入拦截，所以不会得到同样的通知。之后从代理读取可能看到已经变化的数据，并不代表此前的订阅自动收到过更新。</p>
<p>普通解构取得的原始值、普通变量重新赋值或不正确的浅层 API 使用，也可能让读写离开原来的响应式路径。排查时应确认实际操作的是哪一个对象和哪一条属性路径。</p>
<h3>不同操作需要不同的依赖语义</h3>
<p>读取 obj.name 与枚举 Object.keys(obj) 并不完全相同。新增或删除属性，可能影响遍历结果，而修改已有属性值未必改变键集合。数组 length、索引增删，Map/Set 的读取、size 和迭代也有各自关系。</p>
<p>所以一个只拦截普通 get/set 的小 Proxy 演示，并不能完整替代 Vue 响应式。属性存在性、集合内部方法、原型关系与迭代，都需要对应处理。</p>
<p>这也解释了为什么应使用框架提供的集合代理与 API，而不是把任何第三方实例都强行套进同一套深层追踪。外部对象的内部槽或资源管理可能需要浅层引用或其他边界。</p>
<h3>异步过程不会无限延长依赖收集</h3>
<p>watchEffect 自动追踪它同步执行期间读取的响应式来源。async 回调第一次 await 之后才读取的值，不会因此自动成为这一轮同步收集的依赖。</p>
<p>如果副作用有明确输入，watch 显式列出源往往更容易理解。异步结果还要处理失效、取消和旧结果覆盖，不能把“依赖收集正确”当成请求生命周期已经正确。</p>
<p>最后，手动建立的作用应在适当时机停止；组件 setup 中同步建立的侦听通常由组件生命周期管理，脱离该范围的作用则需要明确所有者。响应式关系越清楚，更新与清理越容易验证。</p>`};export{e as default};