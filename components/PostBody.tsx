import Markdoc, { type Node } from '@markdoc/markdoc'
import React from 'react'

/** Renders a post's Markdoc body to React, styled by `.post-body` in globals.css. */
export default function PostBody({ node }: { node: Node }) {
  const tree = Markdoc.transform(node)
  return <div className="post-body">{Markdoc.renderers.react(tree, React)}</div>
}
