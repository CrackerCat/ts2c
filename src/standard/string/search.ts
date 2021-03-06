import * as ts from 'typescript';
import { CodeTemplate, CodeTemplateFactory, CTemplateBase } from '../../template';
import { StandardCallResolver, IResolver } from '../../standard';
import { StringVarType, NumberVarType, RegexVarType } from '../../types/ctypes';
import { IScope } from '../../program';
import { CExpression } from '../../nodes/expressions';
import { CElementAccess } from '../../nodes/elementaccess';
import { TypeHelper } from '../../types/typehelper';

@StandardCallResolver
class StringSearchResolver implements IResolver {
    public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
        if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression)
            return false;
        let propAccess = <ts.PropertyAccessExpression>call.expression;
        let objType = typeHelper.getCType(propAccess.expression);
        return propAccess.name.getText() == "search" && objType == StringVarType;
    }
    public objectType(typeHelper: TypeHelper, call: ts.CallExpression) {
        return StringVarType;
    }
    public argumentTypes(typeHelper: TypeHelper, call: ts.CallExpression) {
        return call.arguments.map((a, i) => i == 0 ? RegexVarType : null);
    }
    public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
        return NumberVarType;
    }
    public createTemplate(scope: IScope, node: ts.CallExpression) {
        return new CStringSearch(scope, node);
    }
    public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
        return false;
    }
    public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
        return null;
    }
    public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
        return null;
    }
}

@CodeTemplate(`
{#if !topExpressionOfStatement}
    {regexVar}.func({argAccess}, FALSE).index
{/if}`)
class CStringSearch extends CTemplateBase
{
    public topExpressionOfStatement: boolean;
    public regexVar: CExpression;
    public argAccess: CElementAccess;
    constructor(scope: IScope, call: ts.CallExpression) {
        super();
        let propAccess = <ts.PropertyAccessExpression>call.expression;
        this.topExpressionOfStatement = call.parent.kind == ts.SyntaxKind.ExpressionStatement;
        if (!this.topExpressionOfStatement) {
            if (call.arguments.length == 1) {
                this.argAccess = new CElementAccess(scope, propAccess.expression);
                this.regexVar = CodeTemplateFactory.createForNode(scope, call.arguments[0]);
            } else
                console.log("Unsupported number of parameters in " + call.getText() + ". Expected one parameter.");
        }
    }
}
