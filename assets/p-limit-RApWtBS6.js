var e={notesHtml:`<p>限制并发数量的小工具：把异步函数交给它，同时运行的任务不超过设定上限。</p>
<p>它限制的是同时运行的任务数，不是每秒请求数。任务必须以函数形式传入，先调用 fetch 再交给它就起不到限制作用。<code>clearQueue</code> 只清除还没开始的任务，正在运行的请求要用 AbortSignal 取消。</p>
<p>许可：MIT。</p>`};export{e as default};