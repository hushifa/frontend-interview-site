var e={answerHtml:`<h2>简答</h2>
<p>复杂表单要分开三类状态：正在编辑的草稿、已保存的基线（用来判断是否有改动、支持重置）、提交过程状态（pending、错误）。v-model 只负责同步值。校验分同步和异步两种，异步校验要丢弃过期结果。提交时禁止重复提交、映射服务端字段错误，成功后用服务端返回的数据更新基线。</p>
<p>复杂表单不只是几个 input。用户正在编辑的内容、上次确认过的内容、是否尝试提交、字段是否失焦、服务器错误和 pending，都代表不同事实。</p>
<p>如果把这些事实都塞进同一个布尔值或反复用 watch 相互复制，就容易出现失败后输入被清空、旧错误覆盖新输入、重复提交和重置回到错误版本等问题。</p>
<h2>先把草稿与确认基线分开</h2>
<p>下面是核心片段：草稿、基线和提交状态分开保存，<code>save</code> 代表真实的保存接口。</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { computed, reactive, ref } from &#x27;vue&#x27;;

const baseline = reactive({ name: &#x27;&#x27;, seats: &#x27;1&#x27; });
const draft = reactive({ ...baseline });
const touched = reactive({ name: false, seats: false });
const attempted = ref(false);
const pending = ref(false);
const serverError = ref(&#x27;&#x27;);

const errors = computed(() =&gt; ({
  name: draft.name.trim() ? &#x27;&#x27; : &#x27;请输入姓名。&#x27;,
  seats: /^[1-9]$/.test(draft.seats) ? &#x27;&#x27; : &#x27;人数请输入 1 到 9 的整数。&#x27;,
}));
// 失焦或尝试提交后才显示错误，避免一打开就满屏报错
const show = (field) =&gt; (touched[field] || attempted.value) &amp;&amp; errors.value[field];
const dirty = computed(() =&gt; draft.name !== baseline.name || draft.seats !== baseline.seats);

async function submit() {
  if (pending.value) return; // 防止重复提交
  attempted.value = true;
  serverError.value = &#x27;&#x27;;
  if (errors.value.name || errors.value.seats) return;

  pending.value = true;
  try {
    // 提交时取一份规范化快照，人数在这里才转成数字
    const result = await save({ name: draft.name.trim(), seats: Number(draft.seats) });
    if (!result.ok) {
      serverError.value = result.message; // 失败保留草稿，便于修改后重试
      return;
    }
    Object.assign(draft, { name: result.record.name, seats: String(result.record.seats) });
    Object.assign(baseline, draft); // 以服务端结果作为新基线
    attempted.value = touched.name = touched.seats = false;
  } finally {
    pending.value = false;
  }
}

function reset() {
  Object.assign(draft, baseline); // 回到最近确认的版本，而不是清空
}
&lt;/script&gt;

&lt;template&gt;
  &lt;form novalidate @submit.prevent=&quot;submit&quot;&gt;
    &lt;fieldset :disabled=&quot;pending&quot;&gt;
      &lt;label for=&quot;name&quot;&gt;姓名&lt;/label&gt;
      &lt;input id=&quot;name&quot; v-model=&quot;draft.name&quot; :aria-invalid=&quot;Boolean(show(&#x27;name&#x27;))&quot;
        aria-describedby=&quot;name-error&quot; @blur=&quot;touched.name = true&quot; /&gt;
      &lt;p id=&quot;name-error&quot;&gt;{{ serverError || show(&quot;name&quot;) }}&lt;/p&gt;
      &lt;!-- 人数字段结构相同，省略 --&gt;
      &lt;button type=&quot;submit&quot;&gt;提交&lt;/button&gt;
      &lt;button type=&quot;button&quot; @click=&quot;reset&quot;&gt;重置草稿&lt;/button&gt;
    &lt;/fieldset&gt;
    &lt;p&gt;未确认修改：{{ dirty ? &quot;有&quot; : &quot;无&quot; }}&lt;/p&gt;
  &lt;/form&gt;
&lt;/template&gt;
</code></pre></div>
<p>组件卸载时还应取消进行中的请求，并忽略之后返回的结果；真实页面里，字段 ID 用 Vue 3.5 的 useId 生成。</p>
<p>baseline 表示当前已确认版本，draft 表示正在编辑的原始字符串。人数在编辑期间仍是字符串，验证通过后才转成数值，避免用户输入到一半就被过早转换。</p>
<p>成功后将规范化结果放回草稿并更新基线，dirty 随之变为 false。失败时不覆盖草稿，用户可以修改后重试。重置回到最近确认的基线，不是无条件清空所有字段。</p>
<h2>提示时机与合法性不是同一个状态</h2>
<p>errors 始终根据当前输入计算，touched 和 attempted 决定是否向用户显示。这样可以避免页面刚打开就把全部空字段标红，也不用另外存一份容易过期的“是否有效”。</p>
<p>示例使用自定义提示，并通过 novalidate 关闭浏览器提交前的交互式校验流程；错误通过字段关联和焦点定位展示。不能关闭原生校验后，又忘记提供可用的替代反馈。</p>
<p>服务端字段错误与本地格式错误也分开保存。用户修改姓名时清理与旧姓名相关的服务端错误，避免一条旧错误永远留在已经变化的输入上。</p>
<h2>提交要取得明确快照</h2>
<p>提交前构造 payload，表示这一次确认要处理的内容。示例在 pending 时禁用字段，并在处理函数开头再次检查，避免只依赖按钮外观防重。</p>
<p>如果产品允许提交期间继续编辑，就应额外区分提交快照与新草稿，不能在成功响应到来时无条件把新编辑覆盖掉。多个提交并行时，还需要请求标识或版本策略。</p>
<p>真实 API 的响应必须先验证结构，再映射字段错误和确认数据。服务端仍需进行权限与业务检查，前端 pending 或本地正则都不是安全边界。</p>
<h2>异步校验与动态字段需要额外管理</h2>
<p>用户名占用检查等异步校验，必须防止旧输入的慢响应覆盖新输入。可以取消、编号或比较当前值，不能只看最后一个网络请求终于返回了结果。</p>
<p>动态数组字段要用稳定 ID 关联草稿、错误与焦点，避免删除中间一项后按下标错配错误。字段卸载后是否保留值、重新出现时是否恢复，也应有明确规则。</p>
<p>表单很大时，应避免每次输入都遍历整个深层对象或发出所有异步校验。按字段、字段组、失焦与提交阶段组织，复杂规则可以交给成熟表单和 schema 工具，但仍要理解它们的转换与生命周期。</p>
<h2>清理与恢复同样属于表单设计</h2>
<p>示例卸载时取消本地等待，并阻止失效结果回写；真实请求需要对应 AbortSignal 或任务协议。客户端取消不代表服务器一定没有完成写入，重要操作仍需幂等或状态查询。</p>
<p>保存失败、离开页面、切换记录、重置和再次提交都应测试。把草稿、基线和提交结果分清楚后，v-model 才能专注于输入同步，而不是承担它并不会自动实现的全部表单状态管理。</p>`};export{e as default};