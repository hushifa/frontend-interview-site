var e={answerHtml:`<h2>简答</h2>
<ul>
<li>共同点：组件、props、state、Hooks、Context 等 React 概念完全一样，状态管理和数据请求库大多可以复用。</li>
<li>差异在渲染层：React Native 把组件渲染成 iOS、Android 的原生视图，没有 DOM，不能用 <code>div</code>、<code>span</code> 和浏览器 API。</li>
<li>基础组件是 <code>View</code>、<code>Text</code>、<code>Image</code>、<code>ScrollView</code>、<code>TextInput</code> 等，文字必须放在 <code>Text</code> 里。</li>
<li>样式用 JS 对象，布局默认 Flexbox 且 <code>flexDirection</code> 默认是 <code>column</code>，没有选择器和样式继承（<code>Text</code> 嵌套除外）。</li>
<li>列表用 <code>FlatList</code> 按需渲染，导航、手势、动画通常依赖 React Navigation、Reanimated 等社区库。</li>
</ul>
<h2>同一个组件的两种写法</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// Web</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Card</span>(<span class="hljs-params">{ title, onPress }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;card&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{onPress}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>{title}<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
  );
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// React Native</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Pressable</span>, <span class="hljs-title class_">Text</span>, <span class="hljs-title class_">StyleSheet</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-native&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Card</span>(<span class="hljs-params">{ title, onPress }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Pressable</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{styles.card}</span> <span class="hljs-attr">onPress</span>=<span class="hljs-string">{onPress}</span> <span class="hljs-attr">accessibilityRole</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Text</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{styles.title}</span>&gt;</span>{title}<span class="hljs-tag">&lt;/<span class="hljs-name">Text</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">Pressable</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">const</span> styles = <span class="hljs-title class_">StyleSheet</span>.<span class="hljs-title function_">create</span>({
  <span class="hljs-attr">card</span>: { <span class="hljs-attr">padding</span>: <span class="hljs-number">16</span>, <span class="hljs-attr">borderRadius</span>: <span class="hljs-number">8</span>, <span class="hljs-attr">backgroundColor</span>: <span class="hljs-string">&#x27;#fff&#x27;</span> },
  <span class="hljs-attr">title</span>: { <span class="hljs-attr">fontSize</span>: <span class="hljs-number">18</span>, <span class="hljs-attr">fontWeight</span>: <span class="hljs-string">&#x27;600&#x27;</span> },
});
</code></pre></div>
<p>组件逻辑一样，标签、事件名、样式写法和无障碍属性都不同。</p>
<h2>主要差异</h2>
<table><thead><tr><th></th><th>React DOM</th><th>React Native</th></tr></thead><tbody><tr><td>渲染目标</td><td>浏览器 DOM</td><td>原生视图（UIView、android.view.View）</td></tr><tr><td>基础元素</td><td><code>div</code>、<code>span</code>、<code>img</code></td><td><code>View</code>、<code>Text</code>、<code>Image</code></td></tr><tr><td>样式</td><td>CSS，选择器和层叠</td><td>JS 对象，无选择器，无层叠</td></tr><tr><td>布局默认</td><td>块级流式布局</td><td>Flexbox，纵向排列</td></tr><tr><td>尺寸单位</td><td>px、rem、% 等</td><td>无单位数字（密度无关像素）和 %</td></tr><tr><td>事件</td><td><code>onClick</code>、DOM 事件</td><td><code>onPress</code>、手势响应系统</td></tr><tr><td>平台 API</td><td>Web API</td><td>原生模块</td></tr><tr><td>发布</td><td>部署即更新</td><td>应用商店审核；JS 部分可借助 OTA 方案更新</td></tr></tbody></table>
<h2>列表性能</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">FlatList</span>
  data={items}
  keyExtractor={<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">id</span>}
  renderItem={<span class="hljs-function">(<span class="hljs-params">{ item }</span>) =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Card</span> <span class="hljs-attr">title</span>=<span class="hljs-string">{item.title}</span> /&gt;</span></span>}
/&gt;
</code></pre></div>
<p><code>FlatList</code> 只渲染可见区域附近的条目，<code>ScrollView</code> 会一次渲染全部子元素，长列表用后者会占用大量内存。</p>
<h2>平台差异</h2>
<p>同一组件在 iOS 和 Android 上外观或行为可能不同，例如阴影属性、键盘遮挡、返回按钮。可以用 <code>Platform.OS</code> 或 <code>.ios.js</code> / <code>.android.js</code> 文件后缀分别实现。</p>
<h2>和 Web 共享代码</h2>
<ul>
<li>业务逻辑、请求层、状态管理可以放在共享包中供两端使用。</li>
<li>React Native for Web 可以把 RN 组件渲染到浏览器，适合同时面向移动和 Web 的产品，但 Web 端的 SEO 和语义化需要额外关注。</li>
<li>新架构的原理（JSI、Fabric、TurboModules）见<a href="/questions/mobile-rn-bridge/">《React Native 原生桥接和新架构应该怎样理解？》</a>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>RN 是 WebView 吗？不是，界面由原生视图组成，JS 只负责描述界面和处理逻辑。</li>
<li>用 Expo 还是裸 RN？Expo 提供开箱即用的原生模块、构建和更新服务，React Native 官方文档也推荐用框架（如 Expo）开始新项目。</li>
</ul>`};export{e as default};