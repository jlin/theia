// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { bindContributionProvider, CommandContribution, MenuContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory, } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import '../../src/browser/style/index.css';
import { AIChatContribution } from './ai-chat-ui-contribution';
import { AIChatInputWidget } from './chat-input-widget';
import { CodePartRenderer, CommandPartRenderer, HorizontalLayoutPartRenderer, MarkdownPartRenderer, ErrorPartRenderer, ToolCallPartRenderer } from './chat-response-renderer';
import {
    AIEditorManager, AIEditorSelectionResolver,
    GitHubSelectionResolver, TextFragmentSelectionResolver, TypeDocSymbolSelectionResolver
} from './chat-response-renderer/ai-editor-manager';
import { createChatViewTreeWidget } from './chat-tree-view';
import { ChatViewTreeWidget } from './chat-tree-view/chat-view-tree-widget';
import { ChatViewLanguageContribution } from './chat-view-language-contribution';
import { ChatViewMenuContribution } from './chat-view-contribution';
import { ChatViewWidget } from './chat-view-widget';
import { ChatViewWidgetToolbarContribution } from './chat-view-widget-toolbar-contribution';
import { ChatResponsePartRenderer } from './chat-response-part-renderer';

export default new ContainerModule((bind, _ubind, _isBound, rebind) => {
    bindViewContribution(bind, AIChatContribution);
    bind(TabBarToolbarContribution).toService(AIChatContribution);

    bindContributionProvider(bind, ChatResponsePartRenderer);

    bindChatViewWidget(bind);

    bind(AIChatInputWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: AIChatInputWidget.ID,
        createWidget: () => container.get(AIChatInputWidget)
    })).inSingletonScope();

    bind(ChatViewTreeWidget).toDynamicValue(ctx =>
        createChatViewTreeWidget(ctx.container)
    );
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: ChatViewTreeWidget.ID,
        createWidget: () => container.get(ChatViewTreeWidget)
    })).inSingletonScope();

    bind(ChatResponsePartRenderer).to(HorizontalLayoutPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(ErrorPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(MarkdownPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(CodePartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(CommandPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(ToolCallPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(ErrorPartRenderer).inSingletonScope();
    [CommandContribution, MenuContribution].forEach(serviceIdentifier =>
        bind(serviceIdentifier).to(ChatViewMenuContribution).inSingletonScope()
    );

    bind(AIEditorManager).toSelf().inSingletonScope();
    rebind(EditorManager).toService(AIEditorManager);

    bindContributionProvider(bind, AIEditorSelectionResolver);
    bind(AIEditorSelectionResolver).to(GitHubSelectionResolver).inSingletonScope();
    bind(AIEditorSelectionResolver).to(TypeDocSymbolSelectionResolver).inSingletonScope();
    bind(AIEditorSelectionResolver).to(TextFragmentSelectionResolver).inSingletonScope();

    bind(ChatViewWidgetToolbarContribution).toSelf().inSingletonScope();
    bind(TabBarToolbarContribution).toService(ChatViewWidgetToolbarContribution);

    bind(FrontendApplicationContribution).to(ChatViewLanguageContribution).inSingletonScope();

});

function bindChatViewWidget(bind: interfaces.Bind): void {
    let chatViewWidget: ChatViewWidget | undefined;
    bind(ChatViewWidget).toSelf();

    bind(WidgetFactory).toDynamicValue(context => ({
        id: ChatViewWidget.ID,
        createWidget: () => {
            if (chatViewWidget?.isDisposed !== false) {
                chatViewWidget = context.container.get<ChatViewWidget>(ChatViewWidget);
            }
            return chatViewWidget;
        }
    })).inSingletonScope();
}
