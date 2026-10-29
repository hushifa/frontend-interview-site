var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>区别在于输入框的值由谁保管。受控组件是 React 保管：你传 <code>value</code> 和 <code>onChange</code>，输入框显示的永远是 state。非受控组件是浏览器保管：你只用 <code>defaultValue</code> 给个初值，之后通过 <code>ref</code> 或提交时的 <code>FormData</code> 去读。</p>
<p>受控的好处是每次输入都经过你的代码，可以实时格式化、校验，或者让别的按钮跟着变。非受控的好处是简单，不用给每个字段建 state，React 19 的 <code>&lt;form action&gt;</code> 直接把 <code>FormData</code> 交给你。</p>
<p>所以要实时校验、联动就选受控；只在提交时要值、或者表单很大，就选非受控。</p>
<p>有几个坑：传了 <code>value</code> 却不写 <code>onChange</code>，输入框会变成只读；同一个输入框不要在受控和非受控之间切换，初值要用 <code>&#x27;&#x27;</code> 而不是 <code>undefined</code>；<code>&lt;input type=&quot;file&quot;&gt;</code> 只能是非受控的，因为出于安全原因脚本不能设置它的值。</p>
</blockquote>
<h2>受控：边输入边处理</h2>
<p>下面是一个手机号输入框，输入时过滤掉非数字，按钮在凑够 11 位数字时才可点。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">PhoneInput</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [phone, setPhone] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> digits = phone.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\D/g</span>, <span class="hljs-string">&#x27;&#x27;</span>);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span>
        <span class="hljs-attr">value</span>=<span class="hljs-string">{phone}</span>
        <span class="hljs-attr">inputMode</span>=<span class="hljs-string">&quot;numeric&quot;</span>
        <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setPhone(e.target.value.replace(/[^\\d ]/g, &#x27;&#x27;))}
      /&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{digits.length</span> !== <span class="hljs-string">11}</span>&gt;</span>发送验证码<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>用户敲的每个字都先经过 <code>onChange</code>，过滤后写进 <code>phone</code>，输入框再显示 <code>phone</code>。按钮的状态也是从同一个 <code>phone</code> 算出来的，所以输入框和按钮永远一致，不会出现“框里已经 11 位了按钮还是灰的”。</p>
<h2>为什么只写 value 输入框就打不了字</h2>
<p>受控的意思是“输入框显示什么，完全由 <code>value</code> 决定”。你传了 <code>value</code> 却没有 <code>onChange</code>，用户敲字时 state 不会变，React 就继续显示原来的值，看起来就是只读的。React 会在控制台给出警告。</p>
<p>切换问题也是同样的道理。<code>value</code> 是 <code>undefined</code> 时 React 认为它是非受控的，后来变成字符串又成了受控的，React 会警告。所以初值写 <code>&#x27;&#x27;</code>，从一开始就是受控的。</p>
<h2>非受控：提交时一次读出来</h2>
<p>只在提交时需要值的表单，没必要给每个字段建 state：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">FeedbackForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">submit</span>(<span class="hljs-params">formData</span>) {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/feedback&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, <span class="hljs-attr">body</span>: formData });
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{submit}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;title&quot;</span> <span class="hljs-attr">defaultValue</span>=<span class="hljs-string">&quot;&quot;</span> <span class="hljs-attr">required</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">textarea</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;content&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>提交<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>React 19 的 <code>&lt;form action&gt;</code> 会把整个表单的 <code>FormData</code> 直接传给函数，按 <code>name</code> 取值即可。Action 成功后，React 还会自动重置这些非受控字段。</p>
<h2>怎么选</h2>
<p>一般看你什么时候需要这个值。输入时就要用来校验、格式化或联动别的字段，选受控。只在提交时需要，选非受控加 <code>FormData</code>。字段很多、对性能敏感的大表单，以非受控为主，或者用 React Hook Form 这类库。要接入只操作 DOM 的第三方输入组件，用非受控加 ref。</p>
<h2>中文输入法会出什么问题</h2>
<p>用拼音打字时，字还没选定，输入框里是拼音字母，这个阶段叫组合输入。受控输入在组合过程中也会触发 <code>onChange</code>。</p>
<p>如果你在 <code>onChange</code> 里做“去掉非数字”“截断长度”这类改写，就可能把还没打完的拼音改掉，打断输入。需要时可以监听 <code>compositionstart</code> 和 <code>compositionend</code>，等组合结束再处理。</p>
<h2>常见追问</h2>
<p><strong>怎么重置非受控表单？</strong></p>
<blockquote>
<p>调用表单 DOM 的 <code>form.reset()</code>，或者给表单换一个 <code>key</code>，让 React 把它卸载后重新挂载。</p>
</blockquote>
<p><strong>改了 <code>defaultValue</code>，输入框为什么没变？</strong></p>
<blockquote>
<p><code>defaultValue</code> 只在第一次挂载时生效，之后值就由浏览器的输入框自己保管了。想让它变，要么改成受控，要么换 <code>key</code> 让它重新挂载。</p>
</blockquote>`};export{e as default};