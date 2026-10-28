var e={answerHtml:`<h2>简答</h2>
<ul>
<li>查询方式决定测试依赖什么：CSS 选择器依赖 DOM 排列，角色加名称依赖用户可识别的语义。</li>
<li>优先按角色、可访问名称和标签查询。</li>
<li>查询失败时先检查语义是否正确，不要随意加 role 迁就测试。</li>
<li>getBy 立即查找并在缺失时抛错，queryBy 缺失时返回 null，findBy 会自动等待。</li>
</ul>
<p>查询方式决定测试通过什么线索找到界面元素。使用 <code>.form &gt; div:nth-child(2) &gt; button</code>，测试依赖的是当前 DOM 排列；使用“名为保存的按钮”，依赖的是用户可以识别的控件语义。</p>
<p>Testing Library 推荐优先按角色、可访问名称和标签查询，是为了让测试与实际使用方式接近，同时减少无关重构引起的失败。</p>
<h2>角色和名称分别说明“是什么”与“叫什么”</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;nickname&quot;</span>&gt;</span>昵称<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;nickname&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;text&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p>对应查询可以是：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> nickname = screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;textbox&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;昵称&#x27;</span> });
<span class="hljs-keyword">const</span> save = screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;保存&#x27;</span> });
</code></pre></div>
<p>input 通过关联 label 得到可访问名称，button 通常从自身文字得到名称。名称还可能由 aria-label、aria-labelledby 等方式提供，不只是元素的 textContent。</p>
<p>若查询失败，先检查实际语义是否符合预期。不要为了测试加一个随意 role 来覆盖原生语义。不同 input 类型的角色也不同，例如 type=&quot;search&quot; 通常是 searchbox；密码输入没有隐式角色，按标签查询往往更合适。</p>
<h2>getBy、queryBy、findBy 的差别是时机与数量</h2>
<table><thead><tr><th>查询</th><th>没找到</th><th>找到多个</th><th>是否自动等待</th></tr></thead><tbody><tr><td>getBy…</td><td>抛错</td><td>抛错</td><td>否</td></tr><tr><td>queryBy…</td><td>返回 null</td><td>抛错</td><td>否</td></tr><tr><td>findBy…</td><td>超时后拒绝 Promise</td><td>无法在等待期内唯一匹配则拒绝</td><td>是</td></tr></tbody></table>
<p>getBy 适合当前应存在的元素；queryBy 适合检查缺失；findBy 适合等待异步出现。AllBy 版本用于多个结果，其中 queryAllBy 没找到时返回空数组，getAllBy 则会抛错。</p>
<p>要断言错误提示不存在，不能先 getByRole(&#x27;alert&#x27;) 再断言为空，因为查询已经先抛错。可以使用 queryByRole 并检查 null。若提示应该在异步操作后消失，则需 waitFor 或 waitForElementToBeRemoved，不能用一次同步查询赌状态已经更新。</p>
<h2>多个相似控件时缩小范围</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> dialog = screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;dialog&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;编辑资料&#x27;</span> });
<span class="hljs-keyword">const</span> save = <span class="hljs-title function_">within</span>(dialog).<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;保存&#x27;</span> });
</code></pre></div>
<p>这里需要从 Testing Library 导入 within。限定到对话框比拿全页面所有“保存”按钮的第一个更清晰，也避免页面新增其他表单后误点。</p>
<p>screen 的查询通常绑定到 document.body；within 将查询限制在指定节点。测试里若存在多个渲染根或 portal，应确认查询范围与目标内容所在位置一致。</p>
<h2>可访问树中的存在，不等于肉眼一定可见</h2>
<p>getByRole 默认排除许多不在可访问树中的元素，但它并不是浏览器视觉判断器。例如某些元素可能在语义上可查询，却因透明度或其他样式无法被用户看到。</p>
<p>因此找到元素之后，仍应根据目标添加可见、启用、选中等断言。使用 hidden: true 可以查询被排除的元素，但不应为了让失败用例通过就普遍打开；用户要操作的元素是否被隐藏，本来可能就是缺陷。</p>
<h2>文本与 test id 也有合理用途</h2>
<p>普通说明文字适合 getByText，输入值可以用相关查询或值断言。对没有合适语义入口的画布容器、测试专用锚点，可以使用 data-testid；稳定 test id 通常优于依赖样式类名。</p>
<p>但 test id 无法证明控件有名称、角色或正确标签。若所有按钮都只能靠 test id 找到，应该检查是否遗漏可访问性设计，而不是把查询优先级当成无关紧要的风格偏好。</p>
<p>文本匹配也应控制精度：过宽的正则可能同时匹配多个元素，过度绑定整段动态文案又可能让无关翻译调整触发失败。选取真正属于契约的名称和范围，而不是为了少写代码放松条件。</p>
<p>这些示例说明查询规则，不代表一次语义查询就完成无障碍验收。真实键盘顺序、焦点管理、排版和屏幕阅读器行为仍需相应测试。</p>`};export{e as default};