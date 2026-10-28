var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>ref(x)</code> 可以包装任意类型，在 JS 中通过 <code>.value</code> 读写，在模板中自动解包；值是对象时，内部会用 <code>reactive</code> 转换。</li>
<li><code>reactive(obj)</code> 只接受对象、数组、Map、Set，返回原对象的深层响应式 Proxy，读写不需要 <code>.value</code>。</li>
<li><code>reactive</code> 的局限：不能整体替换（<code>state = {...}</code> 会断开连接），解构出的基本类型属性不再响应，传给函数的单个属性也会丢失响应式。</li>
<li>需要解构 <code>reactive</code> 对象时用 <code>toRefs</code>，组合式函数通常返回包含多个 ref 的普通对象。</li>
<li>Vue 官方建议默认使用 <code>ref</code>。</li>
</ul>
<h2>对比</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { reactive, ref, toRefs, watch } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> count = <span class="hljs-title function_">ref</span>(<span class="hljs-number">0</span>);
count.<span class="hljs-property">value</span>++;
count.<span class="hljs-property">value</span> = <span class="hljs-number">10</span>; <span class="hljs-comment">// 整体替换，依然响应</span>

<span class="hljs-keyword">const</span> user = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">20</span> });
user.<span class="hljs-property">age</span>++; <span class="hljs-comment">// 响应</span>

<span class="hljs-keyword">let</span> { name } = user;
name = <span class="hljs-string">&#x27;Chen&#x27;</span>; <span class="hljs-comment">// 只改了局部变量，user.name 不变</span>

<span class="hljs-keyword">const</span> { age } = <span class="hljs-title function_">toRefs</span>(user);
age.<span class="hljs-property">value</span>++; <span class="hljs-comment">// 同步修改 user.age</span>

<span class="hljs-title function_">watch</span>(user.<span class="hljs-property">name</span>, <span class="hljs-function">() =&gt;</span> {}); <span class="hljs-comment">// 错误：传入的是字符串</span>
<span class="hljs-title function_">watch</span>(<span class="hljs-function">() =&gt;</span> user.<span class="hljs-property">name</span>, <span class="hljs-function">() =&gt;</span> {}); <span class="hljs-comment">// 正确：传入 getter</span>
</code></pre></div>
<h2>ref 的解包规则</h2>
<ul>
<li>模板中顶层的 ref 自动解包：<code>{{ count }}</code>。</li>
<li>ref 作为 <code>reactive</code> 对象的属性时，访问时自动解包：<code>reactive({ count }).count</code> 返回数字。</li>
<li>ref 放在数组或 Map 中时不会自动解包，要写 <code>list[0].value</code>。</li>
</ul>
<h2>浅层版本</h2>
<p><code>shallowRef</code> 只追踪 <code>.value</code> 本身的替换，不深入转换内部对象；<code>shallowReactive</code> 只追踪第一层属性。用于大型不可变数据（例如接口返回的大列表、第三方类实例），更新时整体替换：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> rows = <span class="hljs-title function_">shallowRef</span>([]);
rows.<span class="hljs-property">value</span> = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchRows</span>(); <span class="hljs-comment">// 触发更新</span>
rows.<span class="hljs-property">value</span>.<span class="hljs-title function_">push</span>(item); <span class="hljs-comment">// 不触发</span>
rows.<span class="hljs-property">value</span> = [...rows.<span class="hljs-property">value</span>, item]; <span class="hljs-comment">// 触发</span>
</code></pre></div>
<h2>实现原理</h2>
<ul>
<li><code>reactive</code> 用 <code>Proxy</code> 拦截 <code>get</code>（收集依赖）和 <code>set</code>（触发更新）。</li>
<li><code>ref</code> 是一个带 <code>value</code> getter/setter 的对象，因为 Proxy 无法拦截基本类型。</li>
</ul>
<p>Vue 2 用 <code>Object.defineProperty</code> 实现，无法检测新增属性和数组下标赋值，需要 <code>Vue.set</code>；Vue 3 的 Proxy 没有这些限制。</p>
<h2>常见追问</h2>
<ul>
<li><code>reactive</code> 返回的对象和原对象相等吗？不相等，修改原对象不会触发更新，应始终使用 Proxy。</li>
<li>为什么不全部用 <code>reactive</code>？基本类型只能用 <code>ref</code>，而整体替换、解构、跨函数传递的场景 <code>ref</code> 更不容易出错。</li>
</ul>`};export{e as default};