#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { IacJavabubbleStack } from "../lib/iac-javabubble-stack";

const app = new cdk.App();
new IacJavabubbleStack(app, "IacJavabubbleStack", {});
