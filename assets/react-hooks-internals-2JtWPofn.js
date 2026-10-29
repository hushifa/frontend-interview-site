var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个组件里先写 <code>useState(18)</code> 存年龄，再写 <code>useState(&#x27;北京&#x27;)</code> 存城市，两次调用都没有告诉 React“我是年龄”还是“我是城市”。React 的做法是给每个组件保存一组 Hook 数据，渲染前把位置归零，每调用一次 Hook 就取下一格，所以第 1 次调用永远对应年龄，第 2 次永远对应城市。</p>
<p>正因为只认位置，每次渲染的 Hook 调用顺序必须一样。把 Hook 写进 <code>if</code> 里，某次渲染多调或少调一次，后面的 Hook 就会拿到别人那一格的数据。</p>
<p>这些数据挂在组件在界面树里的那个位置上，不在组件函数里。所以组件函数每次重新执行，局部变量都是新的，状态却能保留；组件从这个位置被移除，状态也跟着丢掉。</p>
<p>要注意，React 文档用“数组加下标”来讲这个机制，那是简化后的模型。实际实现的数据结构更复杂，面试时讲清“按顺序对应、挂在树中位置上”就够了，不要把教学模型说成源码。</p>
</blockquote>
<h2>用几行代码模拟 useState</h2>
<p>React 文档在讲 <code>useState</code> 时说明了思路：React 为每个组件保存一组状态，渲染前把当前下标设为 0，每调用一次 <code>useState</code> 就返回下一格并把下标加 1。下面按这个思路写一个极简版本，它只模拟一个组件，不涉及调度和 DOM，是教学模型而不是 React 源码。重点看最后一次渲染后 <code>city</code> 的值。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 教学模型：只模拟一个组件，不是 React 源码</span>
<span class="hljs-keyword">let</span> hooks = [];
<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">useState</span>(<span class="hljs-params">initial</span>) {
  <span class="hljs-keyword">const</span> i = index; <span class="hljs-comment">// 记住这个 Hook 占的是第几格</span>
  <span class="hljs-keyword">if</span> (i &gt;= hooks.<span class="hljs-property">length</span>) hooks.<span class="hljs-title function_">push</span>(initial); <span class="hljs-comment">// 第一次走到这一格才用初始值</span>
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">setState</span> = (<span class="hljs-params">next</span>) =&gt; {
    hooks[i] = next;
  };
  index += <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> [hooks[i], setState];
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">Component, props</span>) {
  index = <span class="hljs-number">0</span>; <span class="hljs-comment">// 每次渲染前把下标归零</span>
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Component</span>(props);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Profile</span>(<span class="hljs-params">{ showName }</span>) {
  <span class="hljs-keyword">const</span> [age, setAge] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">18</span>);
  <span class="hljs-keyword">let</span> name = <span class="hljs-string">&#x27;（未显示）&#x27;</span>;
  <span class="hljs-keyword">if</span> (showName) {
    [name] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;张三&#x27;</span>); <span class="hljs-comment">// 错误示范：条件里调用 Hook</span>
  }
  <span class="hljs-keyword">const</span> [city, setCity] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;北京&#x27;</span>);
  <span class="hljs-keyword">return</span> { age, name, city, setAge, setCity };
}

<span class="hljs-keyword">let</span> ui = <span class="hljs-title function_">render</span>(<span class="hljs-title class_">Profile</span>, { <span class="hljs-attr">showName</span>: <span class="hljs-literal">false</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ui.<span class="hljs-property">age</span>, ui.<span class="hljs-property">name</span>, ui.<span class="hljs-property">city</span>); <span class="hljs-comment">// 18 （未显示） 北京</span>

ui.<span class="hljs-title function_">setAge</span>(<span class="hljs-number">20</span>);
ui = <span class="hljs-title function_">render</span>(<span class="hljs-title class_">Profile</span>, { <span class="hljs-attr">showName</span>: <span class="hljs-literal">false</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ui.<span class="hljs-property">age</span>, ui.<span class="hljs-property">name</span>, ui.<span class="hljs-property">city</span>); <span class="hljs-comment">// 20 （未显示） 北京</span>

ui = <span class="hljs-title function_">render</span>(<span class="hljs-title class_">Profile</span>, { <span class="hljs-attr">showName</span>: <span class="hljs-literal">true</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ui.<span class="hljs-property">age</span>, ui.<span class="hljs-property">name</span>, ui.<span class="hljs-property">city</span>); <span class="hljs-comment">// 20 北京 北京</span>

ui.<span class="hljs-title function_">setCity</span>(<span class="hljs-string">&#x27;上海&#x27;</span>);
ui = <span class="hljs-title function_">render</span>(<span class="hljs-title class_">Profile</span>, { <span class="hljs-attr">showName</span>: <span class="hljs-literal">false</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ui.<span class="hljs-property">age</span>, ui.<span class="hljs-property">name</span>, ui.<span class="hljs-property">city</span>); <span class="hljs-comment">// 20 （未显示） 北京</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(hooks); <span class="hljs-comment">// [ 20, &#x27;北京&#x27;, &#x27;上海&#x27; ]</span>
</code></pre></div>
<p>前两次渲染都正常，<code>setAge(20)</code> 改的是第 0 格，再渲染时第 0 格读出 20。为什么 <code>useState(18)</code> 第二次调用没有把年龄重置回 18？因为初始值只在这一格第一次被创建时用到，之后每次都直接返回已经存的值。</p>
<p>第三次渲染把 <code>showName</code> 设为 <code>true</code>，问题出现了。<code>name</code> 的 Hook 排在第 1 格，可第 1 格存的是城市，于是 <code>name</code> 读到了“北京”。城市的 Hook 被挤到第 2 格，这一格从没创建过，就用初始值“北京”新建了一格。</p>
<p>最后一次渲染又不显示名字，<code>city</code> 回到第 1 格。前一次调用 <code>setCity(&#x27;上海&#x27;)</code> 改的却是第 2 格，所以城市还是“北京”，用户刚做的修改看起来“丢了”。这就是条件调用 Hook 的后果：数据本身没坏，只是对错了位置。真实的 React 遇到前后渲染 Hook 数量不一致时会报错，具体写法和报错见<a href="/questions/react-hooks-rules/">《为什么 Hook 通常必须在组件顶层调用？》</a>。</p>
<h2>为什么不给每个 Hook 起个名字</h2>
<p>React 文档对这个问题的回答是，<code>useState</code> 调用时没有任何“标识”，React 也不会去解析函数代码，它靠的是同一个组件每次渲染时稳定的调用顺序，这样 Hook 的写法才能这么简洁。</p>
<p>按名字存也不是不行，但名字要由使用者保证不重复。自定义 Hook 内部也会调用 <code>useState</code>，两个自定义 Hook 恰好用了同一个名字就会互相覆盖。按顺序存就没有这个问题，自定义 Hook 只是把几次 Hook 调用打包，展开后依然是一串按顺序排好的调用。React 文档也说明，每次调用 Hook 都与其他调用完全独立，自定义 Hook 共享的是有状态的逻辑，不是状态本身。</p>
<h2>状态挂在哪里</h2>
<p>模拟代码把 <code>hooks</code> 放在全局，真实的 React 会把每个组件的 Hook 数据和它在界面树中的位置关联起来。React 文档讲保留和重置状态时说，只要在树的同一位置渲染同一个组件，React 就会保留它的状态；组件被移除，或者同一位置换成了不同的组件，状态就会被丢弃。</p>
<p>这解释了两个常见现象。同一个组件渲染两次，比如两个 <code>&lt;Counter /&gt;</code>，各有一份独立的状态，因为它们在树中位置不同。条件渲染把组件从 <code>&lt;A /&gt;</code> 换成 <code>&lt;B /&gt;</code>，<code>A</code> 的状态不会留给 <code>B</code>。想要在同一位置强制重置状态，可以换一个 <code>key</code>，React 会把它当作另一个组件。</p>
<h2>常见追问</h2>
<p><strong>setState 是怎么知道要改哪一格的？</strong></p>
<blockquote>
<p>在教学模型里，<code>setState</code> 是在创建那一格时生成的函数，通过闭包记住了自己的下标，所以不管在哪里被调用，改的都是同一格。真实的 React 里，<code>set</code> 函数同样绑定到它所属组件的那个 Hook 上，React 文档也说明 <code>set</code> 函数具有稳定的标识，多次渲染拿到的是同一个函数。</p>
</blockquote>
<p><strong>为什么 <code>useState</code> 的初始值只生效一次？</strong></p>
<blockquote>
<p>初始值只在这一格第一次被创建时使用，之后的渲染直接返回已存的值。所以传入 props 当初始值后，props 再变也不会自动同步到 state。初始值计算很贵时，可以传一个函数 <code>useState(() =&gt; compute())</code>，React 只在初始化组件时调用它（严格模式的开发环境下会调用两次，用来发现不纯的写法）。</p>
</blockquote>
<p><strong>useEffect、useRef 也是按顺序存的吗？</strong></p>
<blockquote>
<p>是的。React 文档说明 Hook 都依赖同一个组件每次渲染时稳定的调用顺序，Hook 规则对所有 Hook 都适用，所以 Effect、ref、memo 的数据同样按调用位置对应。<code>use</code> 是例外，它读的是传进去的 Promise 或 Context，可以条件调用。</p>
</blockquote>`};export{e as default};