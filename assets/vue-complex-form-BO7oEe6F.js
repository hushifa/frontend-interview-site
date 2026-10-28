var e={answerHtml:`<h2>简答</h2>
<ul>
<li>分开三类状态：<code>draft</code>（正在编辑）、<code>baseline</code>（上次保存的值，用于判断是否修改、支持重置）、提交状态（<code>pending</code>、服务端错误）。</li>
<li>校验结果用 <code>computed</code> 从草稿推导，不单独存储；错误在字段失焦或尝试提交后才显示。</li>
<li>提交期间禁用按钮并在函数入口检查 <code>pending</code>，防止重复提交。</li>
<li>提交失败时保留草稿，把服务端返回的字段错误显示在对应字段旁边。</li>
<li>提交成功后用服务端返回的记录更新草稿和基线，因为服务端可能做了规范化。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { computed, reactive, ref } from &#x27;vue&#x27;;

const baseline = reactive({ name: &#x27;&#x27;, seats: &#x27;1&#x27; });
const draft = reactive({ ...baseline });
const touched = reactive({ name: false, seats: false });
const attempted = ref(false);
const pending = ref(false);
const serverErrors = reactive({ name: &#x27;&#x27;, form: &#x27;&#x27; });

const errors = computed(() =&gt; ({
  name: draft.name.trim() ? &#x27;&#x27; : &#x27;请输入姓名&#x27;,
  seats: /^[1-9]$/.test(draft.seats) ? &#x27;&#x27; : &#x27;人数请输入 1 到 9 的整数&#x27;,
}));
const visibleError = (field) =&gt;
  (touched[field] || attempted.value) &amp;&amp; (errors.value[field] || serverErrors[field]);
const dirty = computed(() =&gt; draft.name !== baseline.name || draft.seats !== baseline.seats);

async function submit() {
  if (pending.value) return;
  attempted.value = true;
  serverErrors.name = serverErrors.form = &#x27;&#x27;;
  if (errors.value.name || errors.value.seats) return;

  pending.value = true;
  try {
    const result = await save({ name: draft.name.trim(), seats: Number(draft.seats) });
    if (!result.ok) {
      serverErrors.name = result.fieldErrors?.name ?? &#x27;&#x27;;
      serverErrors.form = result.message ?? &#x27;保存失败&#x27;;
      return;
    }
    Object.assign(draft, { name: result.record.name, seats: String(result.record.seats) });
    Object.assign(baseline, draft);
    attempted.value = touched.name = touched.seats = false;
  } finally {
    pending.value = false;
  }
}

function reset() {
  Object.assign(draft, baseline);
  serverErrors.name = serverErrors.form = &#x27;&#x27;;
}
&lt;/script&gt;

&lt;template&gt;
  &lt;form novalidate @submit.prevent=&quot;submit&quot;&gt;
    &lt;label for=&quot;name&quot;&gt;姓名&lt;/label&gt;
    &lt;input id=&quot;name&quot; v-model=&quot;draft.name&quot; :aria-invalid=&quot;!!visibleError(&#x27;name&#x27;)&quot;
      aria-describedby=&quot;name-error&quot; @blur=&quot;touched.name = true&quot; @input=&quot;serverErrors.name = &#x27;&#x27;&quot; /&gt;
    &lt;p id=&quot;name-error&quot;&gt;{{ visibleError(&#x27;name&#x27;) }}&lt;/p&gt;

    &lt;label for=&quot;seats&quot;&gt;人数&lt;/label&gt;
    &lt;input id=&quot;seats&quot; v-model=&quot;draft.seats&quot; inputmode=&quot;numeric&quot; :aria-invalid=&quot;!!visibleError(&#x27;seats&#x27;)&quot;
      aria-describedby=&quot;seats-error&quot; @blur=&quot;touched.seats = true&quot; /&gt;
    &lt;p id=&quot;seats-error&quot;&gt;{{ visibleError(&#x27;seats&#x27;) }}&lt;/p&gt;

    &lt;p v-if=&quot;serverErrors.form&quot; role=&quot;alert&quot;&gt;{{ serverErrors.form }}&lt;/p&gt;
    &lt;button :disabled=&quot;pending&quot;&gt;{{ pending ? &#x27;保存中…&#x27; : &#x27;保存&#x27; }}&lt;/button&gt;
    &lt;button type=&quot;button&quot; :disabled=&quot;!dirty || pending&quot; @click=&quot;reset&quot;&gt;重置&lt;/button&gt;
  &lt;/form&gt;
&lt;/template&gt;
</code></pre></div>
<p>要点：</p>
<ul>
<li>人数在草稿中保持字符串，提交时才转成数字，避免用户删空输入框时变成 <code>0</code>。</li>
<li>字段级的服务端错误（如&quot;姓名已被占用&quot;）放在对应字段下，用户修改姓名时清除；与字段无关的错误放在表单级提示里。</li>
<li>重置回到基线，而不是清空。</li>
</ul>
<h2>异步校验</h2>
<p>检查用户名是否可用这类异步校验，要丢弃过期的结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { watch, onWatcherCleanup } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-title function_">watch</span>(<span class="hljs-function">() =&gt;</span> draft.<span class="hljs-property">name</span>, <span class="hljs-title function_">async</span> (name) =&gt; {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-title function_">onWatcherCleanup</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>()); <span class="hljs-comment">// Vue 3.5 起可用</span>
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/check-name?q=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(name)}</span>\`</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
    serverErrors.<span class="hljs-property">name</span> = (<span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>()).<span class="hljs-property">taken</span> ? <span class="hljs-string">&#x27;姓名已被占用&#x27;</span> : <span class="hljs-string">&#x27;&#x27;</span>;
  } <span class="hljs-keyword">catch</span> (err) {
    <span class="hljs-keyword">if</span> (err.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-keyword">throw</span> err;
  }
});
</code></pre></div>
<p>用户继续输入时，上一次请求被取消，不会用旧结果覆盖新输入。实际使用时再加上防抖。</p>
<h2>何时用表单库</h2>
<p>字段多、动态增删字段、跨字段校验复杂时，可以用 VeeValidate、FormKit 等库，配合 Zod 这类 schema 统一前后端校验规则。上面的状态划分仍然适用，库只是帮你实现了它。</p>
<h2>常见追问</h2>
<ul>
<li>离开页面时提醒未保存？用 <code>dirty</code> 判断，在路由守卫或 <code>beforeunload</code> 中提示。</li>
<li>为什么不在 <code>watch</code> 里同步草稿和基线？两份数据相互复制容易产生循环和覆盖，基线只在保存成功时更新。</li>
</ul>`};export{e as default};