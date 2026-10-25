var e={answerHtml:`<p>用户关心的是输入关键词后能否找到题目、提交失败后能否重试，而不是组件里用了几个 useState、某个私有方法叫不叫 handleSubmit。组件测试优先验证可观察行为，能让实现重构与产品回归更容易区分。</p>
<p>如果只是把 useState 换成 reducer，界面行为没变，测试通常不该大面积失败；如果重置按钮失效，哪怕内部函数仍被调用，测试也应该发现。</p>
<h3>用一个具体流程定义测试目标</h3>
<p>以题库筛选为例，可以描述：输入不存在的关键词，显示空结果；点击重置，输入清空，题目重新出现。这个契约同时覆盖用户输入、结果和恢复操作。</p>
<p>在已经配置 React Testing Library、user-event、Vitest 与 DOM 环境的项目中，用例可能写成：</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">import</span> { render, screen } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@testing-library/react&#x27;</span>;
<span class="hljs-keyword">import</span> userEvent <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@testing-library/user-event&#x27;</span>;
<span class="hljs-keyword">import</span> { expect, test } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">QuestionSearch</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./QuestionSearch&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;重置筛选后恢复题目&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> user = userEvent.<span class="hljs-title function_">setup</span>();
  <span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">QuestionSearch</span> <span class="hljs-attr">questions</span>=<span class="hljs-string">{[{</span> <span class="hljs-attr">id:</span> &#x27;<span class="hljs-attr">promise</span>&#x27;, <span class="hljs-attr">title:</span> &#x27;<span class="hljs-attr">Promise</span> <span class="hljs-attr">如何工作</span>？&#x27; }]} /&gt;</span></span>);

  <span class="hljs-keyword">const</span> search = screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;textbox&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;搜索题目&#x27;</span> });
  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">type</span>(search, <span class="hljs-string">&#x27;不存在的关键词&#x27;</span>);
  <span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> screen.<span class="hljs-title function_">findByText</span>(<span class="hljs-string">&#x27;没有匹配的题目&#x27;</span>)).<span class="hljs-title function_">toBeTruthy</span>();

  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">click</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;重置&#x27;</span> }));
  <span class="hljs-title function_">expect</span>(search).<span class="hljs-title function_">toHaveValue</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> screen.<span class="hljs-title function_">findByText</span>(<span class="hljs-string">&#x27;Promise 如何工作？&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
});
</code></pre></div>
<p>这是针对假设组件接口的测试示例，项目需提供对应组件；toHaveValue、toBeVisible 还需要配置 jest-dom 的 Vitest matcher。组件可能实现为受控输入、本地状态或 reducer，只要契约保持一致，用例就不需要依赖内部状态名。</p>
<p>使用 input type=&quot;search&quot; 的组件通常对应 searchbox 角色，而非 textbox，查询应匹配真实语义；不要为了让示例测试通过随意修改正确的组件角色。</p>
<h3>按角色与名称寻找控件</h3>
<p><code>getByRole(&#x27;button&#x27;, { name: &#x27;重置&#x27; })</code> 表达用户通过可访问名称识别按钮。相比 <code>.toolbar &gt; div:nth-child(2)</code>，它不会因为无关布局调整失效，还能暴露按钮缺少名称等问题。</p>
<p>输入框优先通过角色或关联标签找到，不要只靠 placeholder 充当永久标签。test id 可以用于没有合适语义入口的对象，但它不能证明控件对用户可识别，更不能替代正确的 HTML 与 ARIA。</p>
<p>行为测试也不是只检查文字出现。按钮是否可操作、错误是否可恢复、焦点是否合理、结果是否与输入匹配，都可能是用户契约的一部分。</p>
<h3>等待结果，而不是猜一个延时</h3>
<p>getBy 适合当前应存在的元素；queryBy 可用于检查不存在；findBy 会等待异步出现。对于其他异步断言，可以使用 waitFor，但应让回调聚焦断言，避免在重试回调中重复点击或提交。</p>
<p><code>await sleep(1000)</code> 既可能在快机器浪费时间，也可能在慢环境仍然不够。应等待加载状态结束或目标结果出现。user-event 的交互方法也常需要 await，才能让测试按真实的异步序列推进。</p>
<h3>Mock 放在必要边界，别把待测行为 Mock 掉</h3>
<p>组件需要远端数据时，可以在网络边界返回受控响应，验证加载、成功、失败和重试。若把整个数据 Hook 替换成永远返回成功状态，可能绕过正想验证的请求与状态协作。</p>
<p>组件的公开回调也是可观察契约。例如选择题目后通知父组件对应 ID，可以验证回调参数；这不同于断言组件内部某个私有函数被调用几次。重点是这个行为是否属于使用者依赖的接口。</p>
<h3>用户视角不代表一种测试包办所有问题</h3>
<p>纯计算规则可用单元测试快速覆盖边界；组件测试验证区域内交互；端到端测试验证真实路由、网络和关键流程。DOM 模拟环境不具备完整排版与浏览器行为，不能据此证明拖拽、滚动、视觉布局或真实读屏体验正确。</p>
<p>优先建立能抓住真实失败的成功、错误和恢复路径，避免既断言大量内部细节，又用整个 DOM 快照把无关改动锁死。好的测试让行为变化明确可见，同时给正常重构留下空间。</p>`};export{e as default};