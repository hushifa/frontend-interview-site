var e={answerHtml:`<h2>简答</h2>
<ul>
<li>设计 token 给稳定的设计决策命名，让组件表达用途而不是具体色值。</li>
<li>基础 token 存原始值，语义 token 表达用途，组件 token 表达组件的局部契约。</li>
<li>不必处处三层，小系统两层可能足够。</li>
<li>只是给另一个变量换名、没有独立职责的 token 不值得存在。</li>
</ul>
<p>如果几十个组件都直接使用某个蓝色色号，改品牌色时也许可以全局替换。但当这个蓝色同时用于主按钮、链接、选中背景和装饰图形时，它们未必应该永远一起变化。</p>
<p>设计 token 的价值是给稳定的设计决策命名，让组件表达“我需要主操作背景”，而不是只记住“这里用了某个蓝色”。这样主题变化可以调整语义映射，而不必逐个猜测硬编码值原本的用途。</p>
<h2>三种层次各解决什么问题</h2>
<p>基础 token 保存色板、尺寸或字体等原始选择，例如 blue-700。语义 token 表达用途，例如 action-background、text-muted、surface。组件 token 则表达某个组件的局部契约，例如 button-background。</p>
<p>这不是必须处处保留三层的规定。小系统用基础与语义两层就可能足够；只有组件需要稳定扩展点或独立变体时，再引入相应组件 token。</p>
<p>层级太多会让开发者追踪很久才能找到最终颜色。一个变量如果只是把另一个变量换了名字，却没有新的职责或独立变化需求，就要考虑它是否值得存在。</p>
<h2>用一个按钮理解主题映射</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span>,
<span class="hljs-selector-attr">[data-theme=<span class="hljs-string">&#x27;light&#x27;</span>]</span> {
  <span class="hljs-attr">--palette-blue-700</span>: <span class="hljs-number">#1d4ed8</span>;
  <span class="hljs-attr">--color-action-background</span>: <span class="hljs-built_in">var</span>(--palette-blue-<span class="hljs-number">700</span>);
  <span class="hljs-attr">--color-action-text</span>: <span class="hljs-number">#fff</span>;
}

<span class="hljs-selector-attr">[data-theme=<span class="hljs-string">&#x27;dark&#x27;</span>]</span> {
  <span class="hljs-attr">--color-action-background</span>: <span class="hljs-number">#bfdbfe</span>;
  <span class="hljs-attr">--color-action-text</span>: <span class="hljs-number">#172554</span>;
}

<span class="hljs-selector-class">.action-button</span> {
  <span class="hljs-attr">--button-background</span>: <span class="hljs-built_in">var</span>(--color-action-background);
  <span class="hljs-attr">--button-text</span>: <span class="hljs-built_in">var</span>(--color-action-text);
  <span class="hljs-attribute">background-color</span>: <span class="hljs-built_in">var</span>(--button-background);
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--button-text);
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid transparent;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">0.5rem</span> <span class="hljs-number">0.75rem</span>;
}
</code></pre></div>
<p>按钮不需要根据主题写业务分支，只消费相应语义。暗色主题同时调整背景和文字，不能只换背景后仍假定原来的前景色一定清楚。</p>
<p>例子把组件层的别名放在按钮自身计算，使它能使用所在主题作用域继承下来的语义值。light 规则也可以用于暗色区域里的局部浅色区域，而不只依赖最外层主题。</p>
<p>这些颜色只是展示映射关系，完整主题还需要验证焦点、边框、禁用、悬停、错误等状态，不能据此声称整个组件已经满足对比度与可访问性要求。</p>
<h2>CSS 变量别名不是任意位置都会重新求值的指针</h2>
<p>假设在根元素定义 <code>--component-color: var(--semantic-color)</code>。后代继承的可能是根元素处已经计算好的结果；只在后代修改 semantic-color，不意味着根元素计算出的 component-color 会按后代环境重新展开。</p>
<p>因此嵌套主题要明确在哪一层重新声明映射，或者让组件直接读取当前作用域的语义值。不要把所有别名都集中在 :root，然后假设任意局部主题覆盖都会自然传递到每层别名。</p>
<p>CSS 自定义属性还受继承、层叠和作用域影响。变量存在但给出不适合当前属性的值时，<code>var(--name, fallback)</code> 的 fallback 也不是所有无效样式的通用修复；应检查最终 computed style，而不只检查变量字符串是否定义。</p>
<h2>Token 与 CSS 自定义属性不是同一个概念</h2>
<p>Token 是可命名、可复用的设计决策，CSS 自定义属性是 Web 上实现它的一种方式。项目也可以从统一数据生成不同平台的样式或代码，但转换需要处理单位、颜色格式、字体和平台能力差异。</p>
<p>一个 JSON 文件里集中放了很多常量，不代表已经有一致的设计语义；反过来，一个较小项目即使没有专门的生成工具，也可以通过清晰命名和约定建立有用的 token 体系。</p>
<p>跨平台共享应从真正共同的决策出发，不要为了统一格式把平台之间本来不同的行为强行抹平。</p>
<h2>怎样判断一个值值得成为公共 token</h2>
<p>可以看它是否表达稳定决策、是否有真实复用、未来是否希望统一调整，以及使用者能否从名字理解用途。</p>
<p>品牌颜色、主要文本色、常用间距尺度通常有较明确的共享价值。某个页面为一张特殊插图偏移 3px，则不一定需要加入全局 token；放进公共体系后，它会产生命名、文档和维护成本。</p>
<p>语义也不宜过于模糊。一个叫 primary 的变量可能被理解为主要文字、主操作或品牌装饰。明确到用途后，主题和组件才更容易分别演化。</p>
<h2>迁移和约束比“统一替换色号”更重要</h2>
<p>组件应逐步停止绕过语义层直接引用临时色号，文档要说明哪些 token 是公开契约、哪些只是内部实现。改名或删除时提供迁移路径，避免业务长期兼容多套近似变量。</p>
<p>验证应覆盖默认主题、局部主题和实际组件状态，并检查第三方组件是否接受相应映射。Token 可以帮助一致性，但不会自动修复错误组件、对比度或键盘行为。</p>
<p>一个好的体系让常见决策更容易使用、变化影响更容易解释。如果增加层级后，开发者更难知道应该覆盖哪个变量，就需要收敛结构，而不是继续往常量表里加名字。</p>`};export{e as default};