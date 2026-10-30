var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>看一个输入框：写 <code>&lt;input value={name} onChange={e =&gt; setName(e.target.value)} /&gt;</code>，输入框显示什么完全由 <code>name</code> 这个 state 决定，这是受控的。只写 <code>&lt;input defaultValue=&quot;张三&quot; /&gt;</code>，React 只给了一个初值，之后的值由浏览器的输入框自己保存，这是非受控的。</p>
<p>这对概念不只用于表单。react.dev 的说法是：组件的重要信息由自己的局部 state 决定，父组件影响不了，就叫非受控；由 props 驱动、父组件能完全指定它的行为，就叫受控。官方也说明这不是严格的技术术语，一个组件常常两者混用。</p>
<p>选择的依据是灵活性和使用成本。非受控组件用起来简单，父组件不用管它；可是多个组件要协调时就不方便。受控组件最灵活，父组件可以随时改它、校验它、让它和别的组件联动，代价是父组件要把 props 全部配好。</p>
<p>输入框有几条硬规则：传了 <code>value</code> 就必须同时传 <code>onChange</code>，否则输入框变成只读；<code>onChange</code> 里要同步把 state 更新为 <code>e.target.value</code>；<code>value</code> 不能先是 <code>undefined</code> 后来变成字符串，因为 React 会把它从非受控切换成受控并发出警告，初值应该写成 <code>&#x27;&#x27;</code>。</p>
</blockquote>
<h2>两种输入框写法对比</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Controlled</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [name, setName] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{name}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setName(e.target.value)} /&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>你好，{name || &#x27;陌生人&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Uncontrolled</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleSubmit</span>(<span class="hljs-params">e</span>) {
    e.<span class="hljs-title function_">preventDefault</span>();
    <span class="hljs-keyword">const</span> formData = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FormData</span>(e.<span class="hljs-property">target</span>);
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;name&#x27;</span>));
  }
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">onSubmit</span>=<span class="hljs-string">{handleSubmit}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;name&quot;</span> <span class="hljs-attr">defaultValue</span>=<span class="hljs-string">&quot;张三&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>提交<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>受控版本里，每敲一个字都先进 <code>onChange</code>，更新 <code>name</code>，React 重新渲染，输入框再显示新的 <code>name</code>。所以下面的问候语能跟着实时变化。</p>
<p>非受控版本里，React 不知道用户输入了什么，要用的时候再去读，比如提交时用 <code>FormData</code> 按 <code>name</code> 取值，或者用 <code>ref</code> 读 DOM 的 <code>value</code>。</p>
<h2>为什么受控的输入框必须同步更新</h2>
<p>受控的意思是“React 强制输入框显示你传的 <code>value</code>”。所以只传 <code>value</code> 不传 <code>onChange</code>，用户敲字时 state 不变，输入框就一直显示原来的值，React 会在控制台报错，提示你要么加 <code>onChange</code>，要么改用 <code>defaultValue</code>，要么明确写 <code>readOnly</code>。</p>
<p><code>onChange</code> 里的更新也有讲究。官方文档举了两个会出问题的写法：把 state 更新成跟 <code>e.target.value</code> 不一样的值，比如直接转大写；或者放进 <code>setTimeout</code> 里异步更新。这两种都可能让光标在每次按键后跳到开头。正确的做法是在 <code>onChange</code> 里同步地 <code>setName(e.target.value)</code>。</p>
<h2>为什么不能在受控和非受控之间切换</h2>
<p><code>value</code> 是 <code>undefined</code> 时，React 认为输入框是非受控的；后来变成字符串，又成了受控的。React 不知道你到底想要哪种，就会报“A component is changing an uncontrolled input to be controlled”。</p>
<p>这个问题常见于数据从接口来的时候：<code>user.name</code> 一开始是 <code>undefined</code>，加载完才有值。官方的改法是初值写成 <code>&#x27;&#x27;</code>，或者写 <code>value={user.name ?? &#x27;&#x27;}</code>，保证 <code>value</code> 从头到尾都是字符串。复选框同理，<code>checked</code> 要始终是布尔值。</p>
<h2>自己写组件时怎么同时支持两种用法</h2>
<p>很多组件库的组件既能受控也能非受控：传了 <code>value</code> 就听父组件的，没传就用自己的内部状态。下面用一个普通对象模拟这个判断，省掉了 React 的渲染过程：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createToggle</span>(<span class="hljs-params">{ value, defaultValue = <span class="hljs-literal">false</span>, onChange } = {}</span>) {
  <span class="hljs-keyword">let</span> inner = defaultValue;
  <span class="hljs-keyword">const</span> isControlled = value !== <span class="hljs-literal">undefined</span>;
  <span class="hljs-keyword">return</span> {
    <span class="hljs-keyword">get</span> <span class="hljs-title function_">checked</span>() {
      <span class="hljs-keyword">return</span> isControlled ? value : inner;
    },
    <span class="hljs-title function_">click</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">const</span> next = !<span class="hljs-variable language_">this</span>.<span class="hljs-property">checked</span>;
      <span class="hljs-keyword">if</span> (!isControlled) inner = next;
      onChange?.(next);
    },
  };
}

<span class="hljs-keyword">const</span> uncontrolled = <span class="hljs-title function_">createToggle</span>({ <span class="hljs-attr">defaultValue</span>: <span class="hljs-literal">false</span> });
uncontrolled.<span class="hljs-title function_">click</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(uncontrolled.<span class="hljs-property">checked</span>); <span class="hljs-comment">// true</span>

<span class="hljs-keyword">let</span> parentState = <span class="hljs-literal">false</span>;
<span class="hljs-keyword">const</span> controlled = <span class="hljs-title function_">createToggle</span>({ <span class="hljs-attr">value</span>: parentState, <span class="hljs-attr">onChange</span>: <span class="hljs-function">(<span class="hljs-params">next</span>) =&gt;</span> { parentState = next; } });
controlled.<span class="hljs-title function_">click</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(controlled.<span class="hljs-property">checked</span>, parentState); <span class="hljs-comment">// false true</span>
</code></pre></div>
<p>非受控的开关点一下就变了，因为它改的是自己的 <code>inner</code>。受控的开关点一下，<code>checked</code> 还是 <code>false</code>，只是通过 <code>onChange</code> 把新值告诉了父组件。为什么不自己变？因为受控组件的值只能由父组件传进来，在 React 里，父组件 <code>setState</code> 后重新渲染，把新的 <code>value</code> 传下来，开关才会变。这就是“单一数据源”。</p>
<h2>常见追问</h2>
<p><strong>表单应该选受控还是非受控？</strong></p>
<blockquote>
<p>看什么时候要用这个值。输入时就要校验、格式化或联动，用受控；只在提交时要值，用非受控加 <code>FormData</code> 更省事。字段很多的表单怎样分配受控和非受控、怎样处理提交状态，见<a href="/questions/react-controlled-forms/">《React 里复杂表单怎样组织？校验、提交状态和错误怎么处理？》</a>。</p>
</blockquote>
<p><strong>受控输入框每敲一个字都渲染，会不会卡？</strong></p>
<blockquote>
<p>如果 state 所在的组件下面有一棵很大的树，可能会。官方的建议是把 state 放到离输入框更近的组件里，避免整棵树跟着渲染；实在避免不了，可以用 <code>useDeferredValue</code> 让输入框保持响应。</p>
</blockquote>
<p><strong>文件输入框能做成受控的吗？</strong></p>
<blockquote>
<p>不能。MDN 说明，脚本不能设置文件选择框的值；它的 <code>value</code> 也只显示加了 <code>C:\\fakepath\\</code> 前缀的文件名，不暴露真实路径，防止恶意代码猜测用户的目录结构。所以它只能是非受控的，选中的文件从 <code>e.target.files</code> 或提交时的 <code>FormData</code> 里读。</p>
</blockquote>
<p><strong>改了 <code>defaultValue</code>，为什么输入框没变？</strong></p>
<blockquote>
<p><code>defaultValue</code> 只决定初值，之后的值由输入框自己保存。想让它重新取初值，可以给它换一个 <code>key</code>，让 React 重新创建这个输入框。</p>
</blockquote>`};export{e as default};