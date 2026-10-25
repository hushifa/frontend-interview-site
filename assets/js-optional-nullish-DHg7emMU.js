var e={answerHtml:`<p>假设用户把音量设为 0，表示静音。如果代码使用 <code>volume || 50</code>，0 会被当成假值，结果反而恢复成 50。这里真正想判断的是“没有提供音量”，而不是“音量是假值”。</p>
<p>空值合并 <code>??</code> 只在左侧是 null 或 undefined 时使用右侧。可选链 <code>?.</code> 则在对应位置的接收者为空值时停止继续访问，并得到 undefined。二者经常一起用，但解决的问题不同。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> ?? <span class="hljs-number">10</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> || <span class="hljs-number">10</span>); <span class="hljs-comment">// 10</span>
<span class="hljs-keyword">const</span> user = <span class="hljs-literal">null</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user?.<span class="hljs-property">profile</span>?.<span class="hljs-property">name</span> ?? <span class="hljs-string">&#x27;匿名&#x27;</span>); <span class="hljs-comment">// 匿名</span>
</code></pre></div>
<h3>默认值应按业务中的“缺失”定义</h3>
<p>| 左侧值 | 使用 <code>value ?? fallback</code> | 使用 <code>value || fallback</code> |
| --- | --- | --- |
| null、undefined | fallback | fallback |
| 0、false、空字符串 | 保留原值 | fallback |
| NaN | 保留 NaN | fallback |
| 普通非空值 | 保留原值 | 保留原值 |</p>
<p>因此 <code>??</code> 也不是“坏数据自动修复”。NaN 不是 null，也不是 undefined，会被保留；用户只输入空格时，非空字符串在两种操作里也都可能保留。如果业务把空白姓名视为缺失，就应明确 trim 后再判断，而不是期待某个操作符替你理解字段含义。</p>
<p><code>&amp;&amp;</code>、<code>||</code> 和 <code>??</code> 都会返回选中的操作数值，不是强制返回布尔值。它们还会短路，未被需要的右侧表达式不会执行。</p>
<h3>可选位置要和数据结构中的可缺失位置对应</h3>
<p><code>user?.profile.name</code> 保护的是 user。user 为 null 时，后续连续链短路；但如果 user 已存在而 profile 是 undefined，继续读取 name 仍会抛错。</p>
<p><code>user?.profile?.name</code> 则在两层都允许缺失。代码应该根据数据契约选择位置，不能把所有点都替换成问号后就认定接口错误已经解决。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> absent = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">let</span> reads = <span class="hljs-number">0</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(absent?.[reads++]); <span class="hljs-comment">// undefined</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(reads); <span class="hljs-comment">// 0</span>

<span class="hljs-keyword">try</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((absent?.<span class="hljs-property">profile</span>).<span class="hljs-property">name</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p>第一行的索引表达式也没有执行，所以 reads 不增加。这说明可选链不仅影响返回值，也影响后续有副作用的表达式是否求值。</p>
<p>括号分组则结束了这里的连续短路链。<code>(absent?.profile)</code> 已经得到 undefined，接下来的普通 <code>.name</code> 仍然会执行，等价于对一个 undefined 临时值读取属性，因此抛错。</p>
<h3>可选调用只处理空函数值，不验证函数类型</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> callbacks = {};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(callbacks.<span class="hljs-property">onDone</span>?.()); <span class="hljs-comment">// undefined</span>

<span class="hljs-keyword">const</span> broken = { <span class="hljs-attr">onDone</span>: <span class="hljs-number">42</span> };
<span class="hljs-keyword">try</span> {
  broken.<span class="hljs-property">onDone</span>?.();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p><code>onDone?.()</code> 可以表达“回调没有提供就不调用”，但 42 不是空值，仍然会进入调用尝试并报错。需要接受不可信的动态输入时，应通过 typeof 等方式验证类型，而不是把可选调用当作类型检查。</p>
<p><code>obj.method?.()</code> 保留了正常方法调用的接收者关系；先把 method 取出再作为普通函数调用，会涉及另一个 this 问题。可选链不会自动把一个脱离对象的方法重新绑定回去。</p>
<p>如果 obj 本身也可能为空，应考虑 <code>obj?.method?.()</code>。但真正没有声明过的标识符不能靠 <code>missingVariable?.field</code> 安全访问，名字解析仍然会先触发 ReferenceError。</p>
<h3>getter 与方法内部的异常仍然会抛出</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> object = {
  <span class="hljs-keyword">get</span> <span class="hljs-title function_">data</span>() {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;读取失败&#x27;</span>);
  },
};

<span class="hljs-keyword">try</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(object?.<span class="hljs-property">data</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>); <span class="hljs-comment">// 读取失败</span>
}
</code></pre></div>
<p>object 存在，所以仍然会执行 getter。可选链只检查特定的空值边界，不会吞掉访问器、Proxy trap 或函数体里面发生的异常。需要错误恢复时，仍应根据具体操作使用 try/catch 或 Promise 错误处理。</p>
<h3>与逻辑运算混用时，明确写括号</h3>
<p>JavaScript 不允许把 <code>??</code> 与 <code>||</code>、<code>&amp;&amp;</code> 不加括号地直接混在相应表达式中。应明确写成 <code>value ?? (backup || fallback)</code> 或 <code>(value ?? backup) || fallback</code>，但这两者含义不同。</p>
<p>例如 value 为 0 时，前一种保留 0，后一种还会继续经过 ||，最终可能使用 fallback。加括号不只是为了消除语法错误，也是在明确真正想要的业务规则。</p>
<p>空值合并赋值 <code>??=</code> 可以在左侧当前为空值时才赋值，它也不会把合法的 0 或 false 覆盖掉。可选链通常不能作为普通赋值左侧，例如不能写 <code>user?.name = value</code> 来表达“有用户就改名字”，应使用明确条件。</p>
<h3>不要把必要数据的错误变成静默默认值</h3>
<p>对可选的头像、辅助说明、可缺省配置，<code>?.</code> 与 <code>??</code> 能清楚表达预期。如果登录用户必须有唯一 ID，接口却漏了该字段，一路可选链再默认成空字符串可能把错误推迟到更难定位的地方。</p>
<p>在数据入口验证必要字段，只有确实可缺失的部分才采用默认值。这样可选链能减少无意义的防御代码，同时保留真正错误应有的可见性。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining">MDN · Optional chaining</a>。</p>`};export{e as default};