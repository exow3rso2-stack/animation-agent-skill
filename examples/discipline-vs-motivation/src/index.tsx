import React from "react";
import { Composition, registerRoot } from "remotion";
import { ClimbShort, CLIMB_FRAMES } from "./videos/climb/Climb";
const Root: React.FC = () => <Composition id="ClimbShort" component={ClimbShort} durationInFrames={CLIMB_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
