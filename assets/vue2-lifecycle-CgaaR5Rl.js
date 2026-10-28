var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题 Vue 2 部分以 2.7 为准。何时请求数据、何时清理资源见<a href="/questions/vue-lifecycle/">《Vue 生命周期中何时访问 DOM、发请求和清理资源？》</a>，本题只讲版本对照与执行顺序。</p>
</blockquote>
<h2>简答</h2>
<ul>
<li>选项式钩子在 Vue 3 中基本保留，只有两个改名：<code>beforeDestroy</code> → <code>beforeUnmount</code>，<code>destroyed</code> → <code>unmounted</code>。</li>
<li>组合式 API 没有 <code>beforeCreate</code>/<code>created</code> 对应函数，<code>setup()</code> 本身承担这部分工作，并且在所有选项式钩子之前执行，包括 <code>beforeCreate</code>。</li>
<li>创建阶段：父组件执行到 <code>beforeMount</code> 后开始渲染子组件，子组件全部 <code>mounted</code> 后父组件才 <code>mounted</code>。</li>
<li>更新阶段：父 <code>beforeUpdate</code> → 子 <code>beforeUpdate</code> → 子 <code>updated</code> → 父 <code>updated</code>。</li>
<li>销毁阶段（Vue 2）：父 <code>beforeDestroy</code> → 子 <code>beforeDestroy</code> → 子 <code>destroyed</code> → 父 <code>destroyed</code>；Vue 3 的卸载顺序相同，只是名字换成 unmount。</li>
</ul>
<h2>钩子对照表</h2>
<table><thead><tr><th>Vue 2 选项</th><th>Vue 3 选项</th><th>Vue 3 组合式 API（2.7 也可用）</th></tr></thead><tbody><tr><td><code>beforeCreate</code></td><td><code>beforeCreate</code></td><td>无，写在 <code>setup()</code> 中</td></tr><tr><td><code>created</code></td><td><code>created</code></td><td>无，写在 <code>setup()</code> 中</td></tr><tr><td><code>beforeMount</code></td><td><code>beforeMount</code></td><td><code>onBeforeMount</code></td></tr><tr><td><code>mounted</code></td><td><code>mounted</code></td><td><code>onMounted</code></td></tr><tr><td><code>beforeUpdate</code></td><td><code>beforeUpdate</code></td><td><code>onBeforeUpdate</code></td></tr><tr><td><code>updated</code></td><td><code>updated</code></td><td><code>onUpdated</code></td></tr><tr><td><code>beforeDestroy</code></td><td><code>beforeUnmount</code></td><td><code>onBeforeUnmount</code></td></tr><tr><td><code>destroyed</code></td><td><code>unmounted</code></td><td><code>onUnmounted</code></td></tr><tr><td><code>activated</code> / <code>deactivated</code></td><td>同名</td><td><code>onActivated</code> / <code>onDeactivated</code></td></tr><tr><td><code>errorCaptured</code></td><td>同名</td><td><code>onErrorCaptured</code></td></tr></tbody></table>
<p>改名记录在迁移指南的“Other Minor Changes”中。Vue 2.7 把组合式 API 移植回 Vue 2，所以 <code>onMounted</code>、<code>onBeforeUnmount</code> 等也能在 2.7 中使用，便于升级前先改写。</p>
<h2>父子顺序为什么是“父先开始、子先结束”</h2>
<p>父组件渲染时才会创建子组件。父组件进入 <code>beforeMount</code> 后执行渲染和 patch，遇到子组件就完整走一遍子组件的创建与挂载；子组件的 DOM 插入父组件的 DOM 树后，父组件才算挂载完成。</p>
<p>更新时，调度器按 watcher 创建顺序（父先于子）运行渲染 watcher，所以父组件先触发 <code>beforeUpdate</code>；<code>updated</code> 在整个队列执行完后统一调用，Vue 2 源码 <code>callUpdatedHooks</code> 倒序遍历队列，因此子组件的 <code>updated</code> 先于父组件。</p>
<p>销毁时，父组件先触发 <code>beforeDestroy</code>，再递归销毁子组件，最后自己触发 <code>destroyed</code>。</p>
<h2>示例：实际运行结果</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vue@2.7.16，在浏览器中运行</span>
<span class="hljs-keyword">const</span> log = [];
<span class="hljs-keyword">const</span> names = [<span class="hljs-string">&#x27;beforeCreate&#x27;</span>, <span class="hljs-string">&#x27;created&#x27;</span>, <span class="hljs-string">&#x27;beforeMount&#x27;</span>, <span class="hljs-string">&#x27;mounted&#x27;</span>,
  <span class="hljs-string">&#x27;beforeUpdate&#x27;</span>, <span class="hljs-string">&#x27;updated&#x27;</span>, <span class="hljs-string">&#x27;beforeDestroy&#x27;</span>, <span class="hljs-string">&#x27;destroyed&#x27;</span>];
<span class="hljs-keyword">const</span> <span class="hljs-title function_">hooks</span> = (<span class="hljs-params">who</span>) =&gt; <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">fromEntries</span>(
  names.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">h</span>) =&gt;</span> [h, <span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${who}</span> <span class="hljs-subst">\${h}</span>\`</span>)]),
);

<span class="hljs-keyword">const</span> <span class="hljs-title class_">Child</span> = { <span class="hljs-attr">props</span>: [<span class="hljs-string">&#x27;msg&#x27;</span>], <span class="hljs-attr">template</span>: <span class="hljs-string">&#x27;&lt;i&gt;{{ msg }}&lt;/i&gt;&#x27;</span>, ...<span class="hljs-title function_">hooks</span>(<span class="hljs-string">&#x27;子&#x27;</span>) };
<span class="hljs-keyword">const</span> vm = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Vue</span>({
  <span class="hljs-attr">data</span>: { <span class="hljs-attr">msg</span>: <span class="hljs-string">&#x27;a&#x27;</span> },
  <span class="hljs-attr">components</span>: { <span class="hljs-title class_">Child</span> },
  <span class="hljs-attr">template</span>: <span class="hljs-string">&#x27;&lt;div&gt;&lt;Child :msg=&quot;msg&quot; /&gt;&lt;/div&gt;&#x27;</span>,
  ...<span class="hljs-title function_">hooks</span>(<span class="hljs-string">&#x27;父&#x27;</span>),
}).$mount();

vm.<span class="hljs-property">msg</span> = <span class="hljs-string">&#x27;b&#x27;</span>;            <span class="hljs-comment">// 触发更新</span>
<span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">nextTick</span>(<span class="hljs-function">() =&gt;</span> vm.$destroy());
</code></pre></div>
<p>输出按阶段整理如下：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">创建：父 beforeCreate, 父 created, 父 beforeMount,
      子 beforeCreate, 子 created, 子 beforeMount, 子 mounted, 父 mounted
更新：父 beforeUpdate, 子 beforeUpdate, 子 updated, 父 updated
销毁：父 beforeDestroy, 子 beforeDestroy, 子 destroyed, 父 destroyed
</code></pre></div>
<p>把同一段代码换成 Vue 3.5（<code>beforeUnmount</code>/<code>unmounted</code>，<code>app.unmount()</code>）运行，三个阶段的顺序完全一致。</p>
<h2>常见追问</h2>
<ul>
<li>子组件的 <code>props</code> 变化一定会触发父组件的 <code>beforeUpdate</code> 吗？不一定。上例中父组件模板读取了 <code>msg</code>，所以父组件也会更新；如果只有子组件依赖的数据变了，只有子组件更新。</li>
<li>在父组件 <code>mounted</code> 中能访问子组件的 DOM 吗？能，子组件此时已挂载。但异步组件或 <code>v-if</code> 后来才渲染的子组件不在此列。</li>
<li>Vue 3 选项式 API 还能写 <code>beforeDestroy</code> 吗？不能直接使用，需要改名；迁移构建 <code>@vue/compat</code> 会对旧名给出兼容与警告。</li>
</ul>`};export{e as default};