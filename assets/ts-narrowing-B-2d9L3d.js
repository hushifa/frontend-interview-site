var e={answerHtml:`<p>TypeScript 会根据 typeof、instanceof、in、相等判断及可辨识字段分析控制流，从联合类型中排除不可能分支。可选链只处理 null 与 undefined，不会替你证明业务字段一定有效。</p>
<p>自定义类型守卫可以返回 value is SomeType，但编译器会相信这个声明，因此实现必须真的检查所声称的条件。直接使用 as 或非空断言只改变编译器理解，不会在运行时验证数据。</p>
<p>例如接收未知 JSON 时，先检查非 null 对象，再检查字段类型；数组、日期等结构也需对应校验。复杂接口可使用 schema 校验库集中定义边界，避免每个组件重复写不完整的守卫。</p>`};export{e as default};