var e={answerHtml:`<p>逻辑属性按照内容书写方向描述尺寸和边缘。inline 轴沿着一行文字的流向，block 轴沿着行的堆叠方向；具体映射由 writing-mode、direction 等决定，不能永远把 inline 理解成水平方向。</p>
<p>例如 margin-inline-start 表示行内起始侧外边距，在横排从左到右的内容中通常对应左侧，在从右到左的内容中则对应右侧。inline-size、padding-block 等也采用相同的逻辑模型。</p>
<p>这让同一组件更容易适配 RTL 和竖排。但屏幕上物理固定的控件也可能确实需要 left 或 top，不能机械替换全部属性。混合使用逻辑和物理属性时还要核对层叠关系，并在实际书写模式下检查图标顺序、溢出和焦点移动。</p>`};export{e as default};