import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  exportToCanvas,
  exportToSvg,
  exportToBlob,
  exportToClipboard,
  Excalidraw,
  useHandleLibrary,
  MIME_TYPES,
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
  restoreElements,
  LiveCollaborationTrigger,
  MainMenu,
  Footer,
  Sidebar,
  languages,
} from "@handraw/excalidraw";
import {
  AppState,
  BinaryFileData,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  Gesture,
  LibraryItems,
  PointerDownState as ExcalidrawPointerDownState,
} from "@handraw/excalidraw/types/types";

import "./App.scss";
// import initialData from "./initialData";

import { NonDeletedExcalidrawElement, ExcalidrawElement } from "@handraw/excalidraw/types/element/types";
import { nanoid } from "nanoid";
import {
  resolvablePromise,
  withBatchedUpdates,
  withBatchedUpdatesThrottled,
  distance2d
} from "./utils";
import { ResolvablePromise } from "@handraw/excalidraw/types/utils";

// declare global {
//   interface Window {
//     ExcalidrawLib: any;
//   }
// }

export interface ExcalidrawDataSource {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
}

type Comment = {
  x: number;
  y: number;
  value: string;
  id?: string;
};

type PointerDownState = {
  x: number;
  y: number;
  hitElement: Comment;
  onMove: any;
  onUp: any;
  hitElementOffsets: {
    x: number;
    y: number;
  };
};
// This is so that we use the bundled excalidraw.development.js file instead
// of the actual source code

const COMMENT_ICON_DIMENSION = 32;
const COMMENT_INPUT_HEIGHT = 50;
const COMMENT_INPUT_WIDTH = 150;

interface ExcalidrawAppProps {
  dataSource: string;
  onChange: (elements: readonly ExcalidrawElement[], state: AppState) => void
}

export default function App({ dataSource, onChange }: ExcalidrawAppProps) {
  const appRef = useRef<any>(null);
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [canvasUrl, setCanvasUrl] = useState<string>("");
  const [exportWithDarkMode, setExportWithDarkMode] = useState(false);
  const [exportEmbedScene, setExportEmbedScene] = useState(false);
  const [theme, setTheme] = useState("light");
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [commentIcons, setCommentIcons] = useState<{ [id: string]: Comment }>(
    {}
  );
  const [comment, setComment] = useState<Comment | null>(null);

  const [langCode, setLangCode] = useState<string>('zh-CN');

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise = resolvablePromise();
  }

  const [
    excalidrawAPI,
    setExcalidrawAPI
  ] = useState<ExcalidrawImperativeAPI | null>(null);

  useHandleLibrary({ excalidrawAPI });

  useEffect(() => {
    // if (!excalidrawAPI) {
    //   return;
    // }
    // const fetchData = async () => {
    //   const res = await fetch("/rocket.jpeg");
    //   const imageData = await res.blob();
    //   const reader = new FileReader();
    //   reader.readAsDataURL(imageData);

    //   reader.onload = function () {
    //     const imagesArray: BinaryFileData[] = [
    //       {
    //         id: "rocket" as BinaryFileData["id"],
    //         dataURL: reader.result as BinaryFileData["dataURL"],
    //         mimeType: MIME_TYPES.jpg,
    //         created: 1644915140367,
    //         lastRetrieved: 1644915140367
    //       }
    //     ];

    let dataSourceObj: ExcalidrawDataSource;

    try {
      dataSourceObj = JSON.parse(dataSource);
      // 将 appState.collaborators 从 object 类型转为 Map 类型
      if (dataSourceObj?.appState?.collaborators) {
        dataSourceObj.appState.collaborators = new Map(Object.entries(dataSourceObj.appState.collaborators));
      }
    } catch (err) {
      console.error(err);
    }

    //@ts-ignore
    initialStatePromiseRef.current.promise.resolve(dataSourceObj);
    // excalidrawAPI.addFiles(imagesArray);
    // };
    // };
    // fetchData();
  }, [dataSource]);

  const renderTopRightUI = (isMobile: boolean) => {
    return (
      <>
        {/* {!isMobile && (
          <LiveCollaborationTrigger
            isCollaborating={isCollaborating}
            onSelect={() => {
              window.alert("Collab dialog clicked");
            }}
          />
        )} */}
        {/* <button
          onClick={() => alert("This is dummy top right UI")}
          style={{ height: "2.5rem" }}
        >
          {" "}
          Click me{" "}
        </button> */}
      </>
    );
  };

  const updateScene = () => {
    const sceneData = {
      elements: restoreElements(
        [
          {
            type: "rectangle",
            version: 141,
            versionNonce: 361174001,
            isDeleted: false,
            id: "oDVXy8D6rom3H1-LLH2-f",
            fillStyle: "hachure",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            angle: 0,
            x: 100.50390625,
            y: 93.67578125,
            strokeColor: "#c92a2a",
            backgroundColor: "transparent",
            width: 186.47265625,
            height: 141.9765625,
            seed: 1968410350,
            groupIds: [],
            boundElements: null,
            locked: false,
            link: null,
            updated: 1,
            roundness: {
              type: 3,
              value: 32
            },
            frameId: 'test_frame_id', // TODO: frameId 是啥要怎么传？
          }
        ],
        null
      ),
      appState: {
        viewBackgroundColor: "#edf2ff"
      }
    };
    excalidrawAPI?.updateScene(sceneData);
  };

  const onLinkOpen = useCallback(
    (
      element: NonDeletedExcalidrawElement,
      event: CustomEvent<{
        nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
      }>
    ) => {
      const link = element.link!;
      const { nativeEvent } = event.detail;
      const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
      const isNewWindow = nativeEvent.shiftKey;
      const isInternalLink =
        link.startsWith("/") || link.includes(window.location.origin);
      if (isInternalLink && !isNewTab && !isNewWindow) {
        // signal that we're handling the redirect ourselves
        event.preventDefault();
        // do a custom redirect, such as passing to react-router
        // ...
      }
    },
    []
  );

  const onCopy = async (type: "png" | "svg" | "json") => {
    if (!excalidrawAPI) {
      return false;
    }
    await exportToClipboard({
      elements: excalidrawAPI.getSceneElements(),
      appState: excalidrawAPI.getAppState(),
      files: excalidrawAPI.getFiles(),
      type
    });
    window.alert(`Copied to clipboard as ${type} successfully`);
  };

  const [pointerData, setPointerData] = useState<{
    pointer: { x: number; y: number };
    button: "down" | "up";
    pointersMap: Gesture["pointers"];
  } | null>(null);

  const onPointerDown = (
    activeTool: AppState["activeTool"],
    pointerDownState: ExcalidrawPointerDownState
  ) => {
    if (activeTool.type === "custom" && activeTool.customType === "comment") {
      const { x, y } = pointerDownState.origin;
      setComment({ x, y, value: "" });
    }
  };

  const rerenderCommentIcons = () => {
    if (!excalidrawAPI) {
      return false;
    }
    const commentIconsElements = appRef.current.querySelectorAll(
      ".comment-icon"
    ) as HTMLElement[];
    commentIconsElements.forEach((ele) => {
      const id = ele.id;
      const appstate = excalidrawAPI.getAppState();
      const { x, y } = sceneCoordsToViewportCoords(
        { sceneX: commentIcons[id].x, sceneY: commentIcons[id].y },
        appstate
      );
      ele.style.left = `${x - COMMENT_ICON_DIMENSION / 2 - appstate!.offsetLeft
        }px`;
      ele.style.top = `${y - COMMENT_ICON_DIMENSION / 2 - appstate!.offsetTop
        }px`;
    });
  };

  const onPointerMoveFromPointerDownHandler = (
    pointerDownState: PointerDownState
  ) => {
    return withBatchedUpdatesThrottled((event) => {
      if (!excalidrawAPI) {
        return false;
      }
      const { x, y } = viewportCoordsToSceneCoords(
        {
          clientX: event.clientX - pointerDownState.hitElementOffsets.x,
          clientY: event.clientY - pointerDownState.hitElementOffsets.y
        },
        excalidrawAPI.getAppState()
      );
      setCommentIcons({
        ...commentIcons,
        [pointerDownState.hitElement.id!]: {
          ...commentIcons[pointerDownState.hitElement.id!],
          x,
          y
        }
      });
    });
  };
  const onPointerUpFromPointerDownHandler = (
    pointerDownState: PointerDownState
  ) => {
    return withBatchedUpdates((event) => {
      window.removeEventListener("pointermove", pointerDownState.onMove);
      window.removeEventListener("pointerup", pointerDownState.onUp);
      excalidrawAPI?.setActiveTool({ type: "selection" });
      const distance = distance2d(
        pointerDownState.x,
        pointerDownState.y,
        event.clientX,
        event.clientY
      );
      if (distance === 0) {
        if (!comment) {
          setComment({
            x: pointerDownState.hitElement.x + 60,
            y: pointerDownState.hitElement.y,
            value: pointerDownState.hitElement.value,
            id: pointerDownState.hitElement.id
          });
        } else {
          setComment(null);
        }
      }
    });
  };
  const saveComment = () => {
    if (!comment) {
      return;
    }
    if (!comment.id && !comment.value) {
      setComment(null);
      return;
    }
    const id = comment.id || nanoid();
    setCommentIcons({
      ...commentIcons,
      [id]: {
        x: comment.id ? comment.x - 60 : comment.x,
        y: comment.y,
        id,
        value: comment.value
      }
    });
    setComment(null);
  };

  const renderCommentIcons = () => {
    return Object.values(commentIcons).map((commentIcon) => {
      if (!excalidrawAPI) {
        return false;
      }
      const appState = excalidrawAPI.getAppState();
      const { x, y } = sceneCoordsToViewportCoords(
        { sceneX: commentIcon.x, sceneY: commentIcon.y },
        excalidrawAPI.getAppState()
      );
      return (
        <div
          id={commentIcon.id}
          key={commentIcon.id}
          style={{
            top: `${y - COMMENT_ICON_DIMENSION / 2 - appState!.offsetTop}px`,
            left: `${x - COMMENT_ICON_DIMENSION / 2 - appState!.offsetLeft}px`,
            position: "absolute",
            zIndex: 1,
            width: `${COMMENT_ICON_DIMENSION}px`,
            height: `${COMMENT_ICON_DIMENSION}px`,
            cursor: "pointer",
            touchAction: "none"
          }}
          className="comment-icon"
          onPointerDown={(event) => {
            event.preventDefault();
            if (comment) {
              commentIcon.value = comment.value;
              saveComment();
            }
            const pointerDownState: any = {
              x: event.clientX,
              y: event.clientY,
              hitElement: commentIcon,
              hitElementOffsets: { x: event.clientX - x, y: event.clientY - y }
            };
            const onPointerMove = onPointerMoveFromPointerDownHandler(
              pointerDownState
            );
            const onPointerUp = onPointerUpFromPointerDownHandler(
              pointerDownState
            );
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);

            pointerDownState.onMove = onPointerMove;
            pointerDownState.onUp = onPointerUp;

            excalidrawAPI?.setActiveTool({
              type: "custom",
              customType: "comment"
            });
          }}
        >
          <div className="comment-avatar">
            <img src="doremon.png" alt="doremon" />
          </div>
        </div>
      );
    });
  };

  const renderComment = () => {
    if (!comment) {
      return null;
    }
    const appState = excalidrawAPI?.getAppState()!;
    const { x, y } = sceneCoordsToViewportCoords(
      { sceneX: comment.x, sceneY: comment.y },
      appState
    );
    let top = y - COMMENT_ICON_DIMENSION / 2 - appState.offsetTop;
    let left = x - COMMENT_ICON_DIMENSION / 2 - appState.offsetLeft;

    if (
      top + COMMENT_INPUT_HEIGHT <
      appState.offsetTop + COMMENT_INPUT_HEIGHT
    ) {
      top = COMMENT_ICON_DIMENSION / 2;
    }
    if (top + COMMENT_INPUT_HEIGHT > appState.height) {
      top = appState.height - COMMENT_INPUT_HEIGHT - COMMENT_ICON_DIMENSION / 2;
    }
    if (
      left + COMMENT_INPUT_WIDTH <
      appState.offsetLeft + COMMENT_INPUT_WIDTH
    ) {
      left = COMMENT_ICON_DIMENSION / 2;
    }
    if (left + COMMENT_INPUT_WIDTH > appState.width) {
      left = appState.width - COMMENT_INPUT_WIDTH - COMMENT_ICON_DIMENSION / 2;
    }

    return (
      <textarea
        className="comment"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          position: "absolute",
          zIndex: 1,
          height: `${COMMENT_INPUT_HEIGHT}px`,
          width: `${COMMENT_INPUT_WIDTH}px`
        }}
        ref={(ref) => {
          setTimeout(() => ref?.focus());
        }}
        placeholder={comment.value ? "Reply" : "Comment"}
        value={comment.value}
        onChange={(event) => {
          setComment({ ...comment, value: event.target.value });
        }}
        onBlur={saveComment}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === "Enter") {
            event.preventDefault();
            saveComment();
          }
        }}
      />
    );
  };

  const renderSidebar = () => {
    return (
      // TODO: name 取值应该是啥？
      <Sidebar name="test_name">
        <Sidebar.Header>Custom header!</Sidebar.Header>
        Custom sidebar!
      </Sidebar>
    );
  };

  const switchLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLangCode(e?.target?.value);
  }

  const switchTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  const renderMenu = () => {
    return (
      <MainMenu>
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Export />
        <MainMenu.Separator />
        {/* <MainMenu.DefaultItems.LiveCollaborationTrigger
          isCollaborating={isCollaborating}
          onSelect={() => window.alert("You clicked on collab button")}
        /> */}
        {/* <MainMenu.Group title="Excalidraw links"> */}
        <MainMenu.DefaultItems.Socials />
        {/* </MainMenu.Group> */}
        <MainMenu.Separator />
        <MainMenu.DefaultItems.ToggleTheme />
        <MainMenu.ItemCustom>
          <select name="language" id="language" defaultValue={'zh-CN'} onChange={switchLanguage} >
            {languages.filter(language => !language.code.startsWith('__')).map(language => {
              return <option key={language.code} value={language.code}>{language.label}</option>
            })}
          </select>
        </MainMenu.ItemCustom>
        <MainMenu.ItemCustom>
          <div className="switch-theme" onClick={switchTheme}>{theme}</div>
        </MainMenu.ItemCustom>
        <MainMenu.DefaultItems.Help />

        {/* {excalidrawAPI && <MobileFooter excalidrawAPI={excalidrawAPI} />} */}
      </MainMenu>
    );
  };
  return (
    <div className="App" ref={appRef} style={{ width: '100%', height: '100%' }}>
      <div className="excalidraw-wrapper">
        <Excalidraw
          ref={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
          initialData={initialStatePromiseRef.current.promise}
          onChange={(elements, state) => {
            onChange(elements, state);
          }}
          onPointerUpdate={(payload: {
            pointer: { x: number; y: number };
            button: "down" | "up";
            pointersMap: Gesture["pointers"];
          }) => setPointerData(payload)}
          viewModeEnabled={viewModeEnabled}
          zenModeEnabled={zenModeEnabled}
          gridModeEnabled={gridModeEnabled}
          theme={theme}
          langCode={langCode}
          name="Custom name of drawing"
          UIOptions={{ canvasActions: { loadScene: false } }}
          renderTopRightUI={renderTopRightUI}
          onLinkOpen={onLinkOpen}
          onPointerDown={onPointerDown}
          onScrollChange={rerenderCommentIcons}
        // renderSidebar={renderSidebar}
        >
          {/* {excalidrawAPI && (
              <Footer>
                <CustomFooter excalidrawAPI={excalidrawAPI} />
              </Footer>
            )} */}
          {renderMenu()}
        </Excalidraw>
        {Object.keys(commentIcons || []).length > 0 && renderCommentIcons()}
        {comment && renderComment()}
      </div>

    </div>
  );
}
