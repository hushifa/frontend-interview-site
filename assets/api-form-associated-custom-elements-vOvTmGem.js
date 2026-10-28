var e={answerHtml:`<p>组件库经常希望把一个复杂控件写成 <code>&lt;price-input&gt;</code> 或 <code>&lt;date-range-picker&gt;</code>，但使用者仍能像使用原生 <code>&lt;input&gt;</code> 一样把它放进 <code>&lt;form&gt;</code>：浏览器收集它的值、执行 <code>required</code> 校验、响应 <code>form.reset()</code>，提交失败时还能把焦点放到内部输入框。仅仅在自定义元素内部放一个 <code>&lt;input&gt;</code> 并不能自动做到这些，因为 Shadow DOM 内部的控件不是外层表单的直接表单关联控件。</p>
<p>表单关联自定义元素（form-associated custom element）通过 <code>ElementInternals</code> 把组件和外层表单连接起来。组件仍然自己管理内部 DOM 和交互，但把值、有效性和生命周期状态交给浏览器的表单模型。</p>
<h2>先声明组件愿意成为表单控件</h2>
<p>自定义元素类需要设置静态 <code>formAssociated = true</code>，并在构造器中调用 <code>attachInternals()</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">PriceInput</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">HTMLElement</span> {
  <span class="hljs-keyword">static</span> formAssociated = <span class="hljs-literal">true</span>;

  #internals;
  #input;

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">super</span>();
    <span class="hljs-variable language_">this</span>.#internals = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">attachInternals</span>();
    <span class="hljs-keyword">const</span> root = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">attachShadow</span>({ <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;open&#x27;</span> });
    root.<span class="hljs-property">innerHTML</span> = <span class="hljs-string">\`
      &lt;label&gt;
        &lt;span&gt;金额&lt;/span&gt;
        &lt;input inputmode=&quot;decimal&quot; aria-describedby=&quot;error&quot;&gt;
      &lt;/label&gt;
      &lt;span id=&quot;error&quot; role=&quot;alert&quot;&gt;&lt;/span&gt;
    \`</span>;
    <span class="hljs-variable language_">this</span>.#input = root.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;input&#x27;</span>);
    <span class="hljs-variable language_">this</span>.#input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">syncValue</span>());
    <span class="hljs-variable language_">this</span>.#input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;blur&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">syncValidity</span>());
  }

  #<span class="hljs-title function_">syncValue</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> value = <span class="hljs-variable language_">this</span>.#input.<span class="hljs-property">value</span>.<span class="hljs-title function_">trim</span>();
    <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setFormValue</span>(value || <span class="hljs-literal">null</span>);
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">syncValidity</span>();
  }

  #<span class="hljs-title function_">syncValidity</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> value = <span class="hljs-variable language_">this</span>.#input.<span class="hljs-property">value</span>.<span class="hljs-title function_">trim</span>();
    <span class="hljs-keyword">if</span> (!value) {
      <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setValidity</span>({ <span class="hljs-attr">valueMissing</span>: <span class="hljs-literal">true</span> }, <span class="hljs-string">&#x27;请输入金额&#x27;</span>, <span class="hljs-variable language_">this</span>.#input);
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-keyword">const</span> amount = <span class="hljs-title class_">Number</span>(value);
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(amount) || amount &lt; <span class="hljs-number">0</span>) {
      <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setValidity</span>({ <span class="hljs-attr">badInput</span>: <span class="hljs-literal">true</span> }, <span class="hljs-string">&#x27;金额必须是非负数字&#x27;</span>, <span class="hljs-variable language_">this</span>.#input);
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setValidity</span>({});
  }

  <span class="hljs-title function_">formResetCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.#input.<span class="hljs-property">value</span> = <span class="hljs-string">&#x27;&#x27;</span>;
    <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setFormValue</span>(<span class="hljs-literal">null</span>);
    <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setValidity</span>({});
  }
}

customElements.<span class="hljs-title function_">define</span>(<span class="hljs-string">&#x27;price-input&#x27;</span>, <span class="hljs-title class_">PriceInput</span>);
</code></pre></div>
<p>页面可以直接使用：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;order-form&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">price-input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;amount&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">price-input</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>提交<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;reset&quot;</span>&gt;</span>重置<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<p><code>setFormValue()</code> 的第一个参数是提交值。传入 <code>null</code> 表示当前没有要提交的值；传入字符串或 <code>File</code> 等适用值，浏览器才会在表单数据中产生对应的 <code>name=value</code> 条目。自定义元素必须有 <code>name</code> 才能像普通控件一样产生字段；没有 name 时，即使内部状态正常，也不应假设它会自动出现在 <code>FormData</code> 中。</p>
<h2><code>setValidity</code> 连接浏览器校验和内部焦点</h2>
<p><code>setValidity(flags, message, anchor)</code> 让组件把约束状态暴露给外层表单。<code>flags</code> 不是任意业务对象，使用 <code>valueMissing</code>、<code>typeMismatch</code>、<code>badInput</code>、<code>customError</code> 等标准约束标志；传空对象表示有效。设置非空 flags 时必须提供非空消息，否则调用可能抛出异常。</p>
<p>第三个参数可以指向 Shadow DOM 内部的控件，浏览器在交互式校验失败时可以把焦点关联到这个 anchor。它不会替组件自动完成所有读屏提示：内部输入仍需要可访问名称、错误文本和合适的 <code>aria-describedby</code>，组件本身还要提供清楚的外部标签或命名方式。</p>
<p><code>checkValidity()</code> 和 <code>reportValidity()</code> 可以作用于自定义元素，表单调用 <code>checkValidity()</code> 时也会考虑组件的状态。不要只在 click 事件中显示红字，否则键盘提交、脚本 <code>requestSubmit()</code> 和浏览器原生表单流程可能得到不同结果。</p>
<h2>组件生命周期回调不能当成普通 DOM 事件</h2>
<p>除了 <code>formResetCallback()</code>，表单关联自定义元素还可以实现这些回调：</p>
<ul>
<li><code>formAssociatedCallback(form)</code>：元素关联或解除某个表单时调用；</li>
<li><code>formDisabledCallback(disabled)</code>：自身或祖先 <code>fieldset</code> 被禁用时调用；</li>
<li><code>formResetCallback()</code>：外层表单执行 reset 时调用；</li>
<li><code>formStateRestoreCallback(state, mode)</code>：浏览器恢复表单状态时调用，具体触发条件与浏览器实现有关。</li>
</ul>
<p>例如，禁用状态应该同步到内部输入，而不是只给宿主元素加一个看起来灰色的 class：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">formDisabledCallback</span>(<span class="hljs-params">disabled</span>) {
  <span class="hljs-variable language_">this</span>.#input.<span class="hljs-property">disabled</span> = disabled;
  <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">toggleAttribute</span>(<span class="hljs-string">&#x27;aria-disabled&#x27;</span>, disabled);
}
</code></pre></div>
<p>这段回调只有在类已完成初始化后才安全。组件连接、断开、重新连接和表单归属变化可能交错发生，不能假设构造器之后只会有一次生命周期。外部监听器、定时器和异步校验仍需在 <code>disconnectedCallback()</code> 中清理；表单关联能力不会自动取消网络请求。</p>
<h2>初始值、显示值和提交值要分开</h2>
<p>复杂控件常有多个内部值，例如日期范围有开始日期、结束日期和格式化显示文本。提交值可以用一个字符串，也可以使用 <code>FormData</code> 表示多个同名条目；不要把用户看见的本地化字符串直接当成服务端稳定数据：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setFormValue</span>(
  <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">start</span>: <span class="hljs-string">&#x27;2026-10-28&#x27;</span>, <span class="hljs-attr">end</span>: <span class="hljs-string">&#x27;2026-10-31&#x27;</span> }),
);
</code></pre></div>
<p>实际应用应定义稳定的序列化契约、时区、空值和非法范围规则。第二个 <code>setFormValue(value, state)</code> 参数可以保存用于状态恢复的内部状态，通常不应把它当成提交给服务器的第二个字段。恢复状态时需要验证版本和数据来源，不能把任意恢复字符串直接当作可信业务输入。</p>
<p>重置行为也要有明确的初始状态。可以在元素连接时保存属性提供的默认值，在 <code>formResetCallback()</code> 中恢复；不要只把内部 input 清空，却忘记同步 <code>setFormValue()</code> 和有效性状态，否则界面与实际提交数据会不一致。</p>
<h2><code>name</code>、禁用和表单外关联仍按原生规则</h2>
<p>自定义元素的宿主节点才是表单关联控件。它可以放在 form 外，通过 <code>form=&quot;form-id&quot;</code> 关联一个表单，但这只改变归属，不会让任意 Shadow DOM 后代自动参与提交。<code>disabled</code>、祖先 <code>fieldset</code>、表单的 <code>novalidate</code> 和提交按钮规则仍会影响最终行为。</p>
<p>组件不能把禁用只实现成 <code>pointer-events: none</code>：这会让鼠标点不到，却可能仍被键盘聚焦、仍能提交值或仍在辅助技术树中显示为可用。应让 <code>formDisabledCallback</code>、内部控件的 disabled、可访问状态和 <code>setFormValue</code> 的行为保持一致，并实际检查键盘和读屏流程。</p>
<h2>与框架受控组件的边界</h2>
<p>React、Vue 等框架可能把自定义元素当成普通 DOM 元素处理，属性和 property 的传递、事件名称、表单 reset 和受控状态更新需要单独适配。不要因为浏览器原生表单能收集值，就假设框架的 <code>v-model</code> 或 <code>value</code> prop 已经自动双向绑定。</p>
<p>组件可以暴露 <code>value</code> property 和 <code>input</code>/<code>change</code> 自定义事件，但要规定谁是状态的最终来源：</p>
<ul>
<li>用户输入先更新内部值，再调用 <code>setFormValue</code> 并派发事件；</li>
<li>外部设置 property 时，更新内部显示、提交值和校验；</li>
<li>外部状态与用户输入同时到达时，按版本或事件顺序避免旧值覆盖新值；</li>
<li>组件卸载时移除监听和取消异步校验，不能让迟到结果改变已断开的元素。</li>
</ul>
<p>这类契约比“封装一个 input”复杂得多，但它能让组件在原生表单、框架表单和渐进增强页面中保持一致行为。</p>
<h2>兼容性和安全边界</h2>
<p><code>ElementInternals</code>、表单关联自定义元素和相关状态恢复能力属于较新的 Web Components 能力，目标浏览器和 WebView 的支持程度需要查 MDN 兼容性数据并实际验证。旧环境可以把组件降级成普通内部控件或提供显式 hidden input，但降级路径必须避免同一个值被提交两次，并重新实现校验、禁用和 reset 语义。</p>
<p>服务端仍要校验最终提交值。<code>setFormValue</code> 只是浏览器提交路径，不能防止用户直接构造请求、修改 DOM 或绕过前端校验。金额、日期、权限和租户字段必须在服务端按业务规则重新解析和授权；自定义元素的 Shadow DOM 也不是安全边界。</p>
<p>验收一个表单关联自定义元素时，至少检查：</p>
<ul>
<li><code>FormData</code> 是否只出现预期的 name/value，空值和同名多值是否明确；</li>
<li>用户提交、按 Enter、<code>requestSubmit()</code> 和 <code>form.reset()</code> 是否一致；</li>
<li><code>checkValidity()</code>、<code>reportValidity()</code>、错误消息和焦点是否正确；</li>
<li><code>fieldset[disabled]</code>、元素自身 disabled、表单外 <code>form</code> 属性是否有效；</li>
<li>元素移除、重新插入、切换 form 和异步校验后，是否没有重复监听或迟到状态；</li>
<li>不支持 <code>ElementInternals</code> 的浏览器是否仍能显示、提交或明确降级。</li>
</ul>
<p>表单关联自定义元素的价值，不是把所有原生控件行为复制一遍，而是让组件在需要复杂交互时仍遵守浏览器的表单契约。把提交值、有效性、禁用、重置、焦点和资源生命周期一起设计，组件才不会只在演示页面里工作。</p>`};export{e as default};