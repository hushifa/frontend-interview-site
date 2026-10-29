var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题 Vue 2 部分以 2.7 为准。何时请求数据、何时清理资源见<a href="/questions/vue-lifecycle/">《Vue 生命周期中何时访问 DOM、发请求和清理资源？》</a>，本题只讲版本对照与执行顺序。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>选项式 API 的钩子到 Vue 3 基本都保留了，只有两个改了名：<code>beforeDestroy</code> 改成 <code>beforeUnmount</code>，<code>destroyed</code> 改成 <code>unmounted</code>。组合式 API 用 <code>onMounted</code> 这类函数注册，但没有 <code>beforeCreate</code> 和 <code>created</code> 的对应函数，<code>setup()</code> 本身就承担了这部分工作，而且它比所有选项式钩子都早执行，包括 <code>beforeCreate</code>。</p>
<p>父子组件的顺序可以记一句话：父组件先开始，子组件先结束。创建时父组件走到 <code>beforeMount</code> 才开始渲染子组件，子组件全部 <code>mounted</code> 之后，父组件才 <code>mounted</code>。</p>
<p>更新时是父 <code>beforeUpdate</code> → 子 <code>beforeUpdate</code> → 子 <code>updated</code> → 父 <code>updated</code>。销毁时是父 <code>beforeDestroy</code> → 子 <code>beforeDestroy</code> → 子 <code>destroyed</code> → 父 <code>destroyed</code>，Vue 3 的卸载顺序一样，只是名字换成了 unmount。</p>
<p>原因是父组件渲染时才会去创建子组件，子组件的 DOM 放进父组件以后，父组件才算完成。</p>
</blockquote>
<h2>钩子对照表</h2>
<table><thead><tr><th>Vue 2 选项</th><th>Vue 3 选项</th><th>Vue 3 组合式 API（2.7 也可用）</th></tr></thead><tbody><tr><td><code>beforeCreate</code></td><td><code>beforeCreate</code></td><td>无，写在 <code>setup()</code> 中</td></tr><tr><td><code>created</code></td><td><code>created</code></td><td>无，写在 <code>setup()</code> 中</td></tr><tr><td><code>beforeMount</code></td><td><code>beforeMount</code></td><td><code>onBeforeMount</code></td></tr><tr><td><code>mounted</code></td><td><code>mounted</code></td><td><code>onMounted</code></td></tr><tr><td><code>beforeUpdate</code></td><td><code>beforeUpdate</code></td><td><code>onBeforeUpdate</code></td></tr><tr><td><code>updated</code></td><td><code>updated</code></td><td><code>onUpdated</code></td></tr><tr><td><code>beforeDestroy</code></td><td><code>beforeUnmount</code></td><td><code>onBeforeUnmount</code></td></tr><tr><td><code>destroyed</code></td><td><code>unmounted</code></td><td><code>onUnmounted</code></td></tr><tr><td><code>activated</code> / <code>deactivated</code></td><td>同名</td><td><code>onActivated</code> / <code>onDeactivated</code></td></tr><tr><td><code>errorCaptured</code></td><td>同名</td><td><code>onErrorCaptured</code></td></tr></tbody></table>
<p>这两处改名记录在迁移指南的“Other Minor Changes”里。Vue 2.7 把组合式 API 移植回了 Vue 2，所以 <code>onMounted</code>、<code>onBeforeUnmount</code> 这些在 2.7 里也能用，方便升级前先改写。</p>
<h2>为什么是“父先开始、子先结束”</h2>
<p>先看挂载。父组件进入 <code>beforeMount</code> 以后开始执行渲染和 patch，在这个过程中遇到子组件，就把子组件的创建和挂载完整走一遍。子组件的 DOM 插进父组件的 DOM 树以后，父组件的 DOM 才算完整，这时父组件才触发 <code>mounted</code>。</p>
<p>再看更新。调度器按 watcher 的创建顺序运行渲染 watcher，父组件的 watcher 先创建，所以父组件先触发 <code>beforeUpdate</code>。可是 <code>updated</code> 是等整个队列跑完后统一调用的，Vue 2 源码里的 <code>callUpdatedHooks</code> 倒序遍历队列，所以子组件的 <code>updated</code> 反而先于父组件。</p>
<p>最后是销毁。父组件先触发 <code>beforeDestroy</code>，再递归销毁子组件，子组件都销毁完了，父组件才触发 <code>destroyed</code>。</p>
<h2>实际跑一遍看看</h2>
<p>下面给父子组件的 8 个钩子都挂上记录函数，依次触发创建、更新和销毁：</p>
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
<p>三个阶段都符合“父先开始、子先结束”。把同一段代码换成 Vue 3.5（用 <code>beforeUnmount</code>/<code>unmounted</code>，用 <code>app.unmount()</code> 卸载）运行，三个阶段的顺序完全一致。</p>
<h2>常见追问</h2>
<p><strong>子组件的 props 变了，一定会触发父组件的 beforeUpdate 吗？</strong></p>
<blockquote>
<p>不一定。上面的例子里父组件模板读了 <code>msg</code>，所以父组件也会更新。如果变化的数据只有子组件用到，那就只有子组件更新。</p>
</blockquote>
<p><strong>在父组件的 mounted 里能访问子组件的 DOM 吗？</strong></p>
<blockquote>
<p>能，这时子组件已经挂载好了。但异步组件，或者 <code>v-if</code> 后来才渲染出来的子组件，不在此列。</p>
</blockquote>
<p><strong>Vue 3 的选项式 API 还能写 beforeDestroy 吗？</strong></p>
<blockquote>
<p>不能直接用，要改名。迁移构建 <code>@vue/compat</code> 会对旧名字做兼容并给出警告。</p>
</blockquote>`};export{e as default};