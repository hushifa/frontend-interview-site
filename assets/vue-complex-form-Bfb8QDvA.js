var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>复杂表单我会把状态分成三份：用户正在改的草稿 <code>draft</code>，上次保存成功的基线 <code>baseline</code>，以及提交过程本身，比如是否正在提交、服务端返回了什么错误。</p>
<p>分开的原因是它们各管一件事。有基线才能判断“改过没有”，也才能一键重置；校验结果用 <code>computed</code> 从草稿推出来，不单独存一份，就不会出现两份数据对不上。</p>
<p>体验上有几个约定：错误等用户离开这个字段，或者点了提交以后才显示；提交期间禁用按钮，函数入口也检查一次，防止重复提交；失败了保留草稿，把服务端的字段错误放在对应输入框旁边。</p>
<p>提交成功后，要用服务端返回的记录去更新草稿和基线，而不是直接用自己提交的值，因为服务端可能做了规范化，比如去掉了空格。</p>
</blockquote>
<h2>先看一个完整的例子</h2>
<p>下面是一个两个字段的表单。重点看三份状态是怎么分开的，以及 <code>submit</code> 里每一步在防什么。</p>
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
<p><code>errors</code> 一直在根据草稿重新计算，可是页面一打开并不会满屏红字。这是因为 <code>visibleError</code> 多加了一道条件：这个字段被碰过（<code>touched</code>），或者用户已经点过提交（<code>attempted</code>），才把错误显示出来。</p>
<p>人数明明是数字，为什么草稿里存的是字符串 <code>&#x27;1&#x27;</code>？因为用户会把输入框删空。如果一输入就转成数字，删空就变成了 <code>0</code>，校验和显示都会乱。所以草稿保持字符串，提交时才 <code>Number()</code> 转换。</p>
<p>服务端错误分了两种。像“姓名已被占用”这种跟某个字段有关的，放在那个字段下面，用户一改姓名就清掉；跟字段无关的，比如“网络异常”，放在表单级的提示里。</p>
<p>最后，“重置”是回到基线，不是清空。用户编辑一条已有记录时，重置应该回到它原来的样子。</p>
<h2>异步校验怎样避免旧结果覆盖新输入</h2>
<p>检查用户名是否可用这类校验要发请求。问题在于用户一直在打字，先发的请求可能后返回，把新输入的结果盖掉。所以每次发新请求前，要把上一次的取消：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { watch, onWatcherCleanup } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-title function_">watch</span>(<span class="hljs-function">() =&gt;</span> draft.<span class="hljs-property">name</span>, <span class="hljs-title function_">async</span> (name) =&gt; {
  <span class="hljs-keyword">if</span> (!name.<span class="hljs-title function_">trim</span>()) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 空值交给必填校验，不发请求</span>
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
<p><code>onWatcherCleanup</code> 注册的函数会在侦听器下一次执行前调用，所以用户继续输入时，上一次请求就被中止了，旧结果不会写进来。实际使用时再加上防抖，别每敲一个字就发一次请求。</p>
<h2>什么时候该用表单库</h2>
<p>字段很多、要动态增删字段、跨字段校验又复杂时，可以用 VeeValidate、FormKit 这类库，再配合 Zod 这样的 schema 统一前后端的校验规则。不过上面“草稿、基线、提交状态分开”的思路仍然适用，库只是帮你把它实现了。</p>
<h2>常见追问</h2>
<p><strong>离开页面时怎么提醒用户还有没保存的修改？</strong></p>
<blockquote>
<p>用 <code>dirty</code> 判断有没有改过，有的话在路由守卫或者 <code>beforeunload</code> 事件里提示。</p>
</blockquote>
<p><strong>为什么不用 <code>watch</code> 让草稿和基线互相同步？</strong></p>
<blockquote>
<p>两份数据互相复制，很容易出现循环触发或者互相覆盖。基线只应该在保存成功这一个时刻更新，其他时候都不动它，数据流向就很清楚。</p>
</blockquote>`};export{e as default};