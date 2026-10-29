var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>ref</code> 把一个值装进一个盒子里，通过 <code>.value</code> 读写，什么类型都能装，数字、字符串、对象都行。在模板里会自动拆开，不用写 <code>.value</code>。如果装的是对象，里面会用 <code>reactive</code> 转换。</p>
<p><code>reactive</code> 只能用于对象、数组、Map、Set，返回原对象的深层响应式 Proxy，读写时不用 <code>.value</code>。</p>
<p>两者的差别主要在 <code>reactive</code> 的局限。它不能整体替换，<code>state = {...}</code> 以后就和原来断开了；解构出来的基本类型属性不再响应；把单个属性传给函数也会丢失响应式。需要解构时可以用 <code>toRefs</code>。</p>
<p>因为这些坑，Vue 官方建议默认用 <code>ref</code>。组合式函数通常也返回由多个 ref 组成的普通对象。</p>
</blockquote>
<h2>对比两者的行为</h2>
<p>下面这段代码把常见的对和错都放在一起：</p>
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
<p><code>let { name } = user</code> 为什么不响应？因为解构就是把 <code>user.name</code> 当时的值复制给一个新变量，这个变量是普通的字符串，和 Proxy 没有关系了，改它不会经过 Proxy 的拦截。<code>watch(user.name)</code> 也是同样的道理，传进去的只是字符串 <code>&#x27;Lin&#x27;</code>。</p>
<p><code>toRefs</code> 能解决这个问题，它把每个属性转成一个 ref，读写 <code>age.value</code> 时实际上是在读写 <code>user.age</code>，所以两边同步。</p>
<h2>ref 什么时候会自动拆开</h2>
<p>在模板里，顶层的 ref 会自动拆开，直接写 <code>{{ count }}</code> 就行。ref 作为 <code>reactive</code> 对象的属性时，访问时也会自动拆开，<code>reactive({ count }).count</code> 拿到的就是数字。</p>
<p>但 ref 放在数组或 Map 里时不会自动拆开，要写 <code>list[0].value</code>。</p>
<h2>浅层版本适合什么场景</h2>
<p><code>shallowRef</code> 只追踪 <code>.value</code> 本身有没有被换掉，不会深入转换里面的对象；<code>shallowReactive</code> 只追踪第一层属性。它们适合大块的不可变数据，比如接口返回的大列表、第三方类的实例，更新时整体替换：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> rows = <span class="hljs-title function_">shallowRef</span>([]);
rows.<span class="hljs-property">value</span> = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchRows</span>(); <span class="hljs-comment">// 触发更新</span>
rows.<span class="hljs-property">value</span>.<span class="hljs-title function_">push</span>(item); <span class="hljs-comment">// 不触发</span>
rows.<span class="hljs-property">value</span> = [...rows.<span class="hljs-property">value</span>, item]; <span class="hljs-comment">// 触发</span>
</code></pre></div>
<p><code>push</code> 为什么不触发？因为 <code>push</code> 改的是数组内部，<code>.value</code> 指向的还是同一个数组，<code>shallowRef</code> 看不到变化。换成一个新数组赋给 <code>.value</code>，才会触发。</p>
<h2>背后是怎么实现的</h2>
<p><code>reactive</code> 用 <code>Proxy</code> 拦截 <code>get</code> 和 <code>set</code>，读的时候收集依赖，写的时候触发更新。<code>ref</code> 则是一个带 <code>value</code> getter 和 setter 的对象，因为 Proxy 只能代理对象，没法拦截数字、字符串这种基本类型。</p>
<p>Vue 2 用的是 <code>Object.defineProperty</code>，检测不到新增属性和数组下标赋值，需要 <code>Vue.set</code>。Vue 3 的 Proxy 没有这些限制。</p>
<h2>常见追问</h2>
<p><strong>reactive 返回的对象和原对象相等吗？</strong></p>
<blockquote>
<p>不相等，返回的是一个代理。直接修改原对象不会触发更新，所以应该始终通过代理去读写。</p>
</blockquote>
<p><strong>为什么不全部用 reactive？</strong></p>
<blockquote>
<p>基本类型只能用 <code>ref</code>。而且整体替换、解构、跨函数传递这些场景，用 <code>ref</code> 更不容易出错。</p>
</blockquote>`};export{e as default};