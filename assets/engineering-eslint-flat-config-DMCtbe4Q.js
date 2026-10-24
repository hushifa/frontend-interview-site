var e={answerHtml:`<p>Flat Config 使用配置对象数组，按文件匹配和顺序合并；插件和解析器通常通过 JavaScript import 直接传入，而不是只写包名字符串。配置中的 <code>files</code>、<code>ignores</code>、语言选项和规则作用域要明确。</p>
<p>迁移时要检查插件是否支持新的配置方式，处理全局变量、TypeScript parser、测试文件和生成文件。数组顺序会影响覆盖，不能把“最后一项”当成简单的全局默认值。</p>
<p>规范配置属于构建输入，应该锁定依赖、在 CI 执行，并让开发者能理解错误来源。不要为了通过检查关闭一大批规则，先区分代码问题、规则误报和生成文件边界。</p>`};export{e as default};