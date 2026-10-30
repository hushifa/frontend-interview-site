var e={notesHtml:`<p>封装 <code>fs.watch</code>，给出去重后的 <code>add</code>、<code>change</code>、<code>unlink</code> 等事件，各平台都支持递归监听，网络文件系统可改用轮询后端。</p>
<p>它会监听给定路径下的所有内容，应配合 <code>ignored</code> 和 <code>depth</code> 缩小范围。编辑器通过临时文件重命名保存或大文件分块写入时，用 <code>atomic</code> 和 <code>awaitWriteFinish</code> 合并事件。当前 v6 要求 Node.js 22.22 及以上。</p>
<p>许可：MIT。</p>`};export{e as default};