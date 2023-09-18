import React, { useState } from 'react';

import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

export default function App() {
  const windowWidth = Dimensions.get('window').width;
  const BtnWidth = windowWidth * 0.21;
  const themeBtnWidth = BtnWidth * 0.6;
  const ERR = 'Error';
  const SIGNS = '+/-';
  const PERCENT = '%';
  const EQUALS = '=';
  const OPERATORS = ['+', '-', '×', '/'];
  const CLEAR = 'C';
  const ALL_CLEAR = 'AC';
  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
  const STATES = {
    INITIAL: 'INITIAL',
    COLLECTING: 'COLLECTING',
    OPERATOR: 'OPERATOR',
    EQUALS: 'EQUALS',
  };
  // ADD_SUB and MULT_DIV are used
  // to correctly calculate things like: 4+3*2 which is 10 and not 14 where multiplication and division are prioritise over subtraction and addition
  const ADD_SUB = ['+', '-'];
  const MULT_DIV = ['×', '/'];

  const themesButtons = [
    { name: 'grayscale', bgColor: '#e3e3e3' },
    { name: 'ios', bgColor: '#FF7900' },
    { name: 'cyan', bgColor: '#0246FF' },
  ];

  // Following the layout of IOS Calculator
  const row1 = [
    { type: 1, value: ALL_CLEAR },
    { type: 1, value: '+/-' },
    { type: 1, value: '%' },
    { type: 2, value: '/' },
  ];
  const row2 = [
    { type: 0, value: '7' },
    { type: 0, value: '8' },
    { type: 0, value: '9' },
    { type: 2, value: '×' },
  ];
  const row3 = [
    { type: 0, value: '4' },
    { type: 0, value: '5' },
    { type: 0, value: '6' },
    { type: 2, value: '-' },
  ];
  const row4 = [
    { type: 0, value: '1' },
    { type: 0, value: '2' },
    { type: 0, value: '3' },
    { type: 2, value: '+' },
  ];
  const row5 = [
    { type: 3, value: '0' },
    { type: 0, value: '.' },
    { type: 2, value: '=' },
  ];

  const contextNew = {
    operands: [0],
    operators: [],
    stringValue: 0,
    lastOperand: undefined,
    lastOperator: undefined,
    state: STATES.INITIAL,
    theme: 'cyan',
  };

  const [context, setContext] = useState({ ...contextNew });

  const updateState = (ctxt) => {
    setContext((context) => ({
      ...context,
      ...ctxt,
    }));
  };
  //Choosing theme
  const themeButtonPressed = (name) => {
    const ctxt = { ...context };
    if (ctxt.theme != name) {
      ctxt.theme = name;
      updateState(ctxt);
    }
  };

  //Button press functions
  const buttonPressed = (value) => {
    let ctxt = { ...context };
    if (DIGITS.includes(value)) {
      controlDigits(ctxt, value);
      ctxt.state = STATES.COLLECTING;
    } else if (OPERATORS.includes(value)) {
      const changeState = controlOperators(ctxt, value);
      if (changeState === true) {
        ctxt.state = STATES.OPERATOR;
      }
    } else if (value == EQUALS) {
      // can return a complete new context
      ctxt = controlEquals(ctxt);
      ctxt.state = STATES.EQUALS;
    } else if (value == CLEAR && clearable(ctxt)) {
      ctxt.operands.pop();
      ctxt.stringValue = ctxt.operands.slice(-1)[0];
      ctxt.state = STATES.OPERATOR;
    } else if (value == ALL_CLEAR) {
      const theme = ctxt.theme;
      ctxt = { ...contextNew };
      ctxt.theme = theme;
    } else if (value == PERCENT) {
      // independent of state
      controlPercentage(ctxt);
    } else if (value == SIGNS) {
      // independent of state
      controlSign(ctxt);
    }
    updateState(ctxt);
  };

  const clearable = (ctxt) => {
    return ctxt.operands.length > 1 && ctxt.state === STATES.COLLECTING;
  };

  const controlOperators = (ctxt, value) => {
    let changeState = false;

    if (ctxt.state == STATES.OPERATOR && ctxt.operators.length > 0) {
      // change operator
      ctxt.operators.pop();
      ctxt.operators.push(value);
      changeState = true;
    } else {
      ctxt.operators.push(value);
      changeState = true;
    }

    if (
      changeState === true &&
      ctxt.operands.length > 1 &&
      ctxt.operators.length > 0
    ) {
      if (MULT_DIV.includes(value)) {
        const found = ctxt.operators.find((opr) => ADD_SUB.includes(opr));
        if (found) {
          //wait
          return changeState;
        }
      }

      ctxt.stringValue = calculate(ctxt.operands, ctxt.operators);
    }

    return changeState;
  };

  const controlDigits = (ctxt, value) => {
    if (ctxt.state != STATES.COLLECTING) {
      let operand = value == '.' ? '0.' : value;

      if (ctxt.state == STATES.INITIAL) {
        operand = String(ctxt.operands[0]).startsWith('-')
          ? '-' + operand
          : operand;

        ctxt.operands[0] = operand;
      } else if (ctxt.state == STATES.EQUALS) {
        ctxt.operands[0] = operand;
      } else {
        // OPERATOR
        ctxt.operands.push(operand);
      }

      ctxt.stringValue = operand;
    } else {
      //COLLECTING
      const idx = ctxt.operands.length - 1;
      const oldValue = ctxt.operands[idx];

      if (value != '.' || !String(oldValue).includes('.')) {
        const strVal = oldValue + '' + value;
        const operand = value == '.' ? strVal : numParse(strVal);
        ctxt.operands[idx] = operand;
        ctxt.stringValue = operand;
      }
    }
  };

  const controlSign = (ctxt) => {
    if (ctxt.operands.length > 0) {
      const oldOperand = String(ctxt.operands.pop());
      const operand = oldOperand.startsWith('-')
        ? oldOperand.substring(1)
        : '-' + oldOperand;
      ctxt.operands.push(operand);
      ctxt.stringValue = operand;
    }
  };

  const controlPercentage = (ctxt) => {
    if (ctxt.operands.length > 0) {
      const percentagePoint = ctxt.operands.pop();

      let result = percentagePoint / 100;

      if (ctxt.operators.length > 0) {
        // remove operator for percent to calculate the left part
        const lastOperator = ctxt.operators.pop();

        if (ADD_SUB.includes(lastOperator)) {
          const from = calculate(ctxt.operands, ctxt.operators);
          result = from * result;
        }

        // add operator for percent back
        ctxt.operators.push(lastOperator);
      }

      ctxt.operands.push(result);
      ctxt.stringValue = String(result);
    }
  };
  const numParse = (num) => {
    // substitution function for parseFloat
    const strNum = String(num);
    const intValue = parseInt(num);
    const arrValue = strNum.split('.');

    let result = intValue;

    if (arrValue.length > 1) {
      result = '' + intValue + '.' + arrValue[1];
    }

    //sign may get lost with 0
    if (intValue == 0) {
      const sign = strNum.startsWith('-') ? '-' : '';
      result = sign + result;
    }

    return result;
  };

  const mergeAltArrays = ([x, ...xs], ...rest) => {
    // credit: https://stackoverflow.com/questions/47061160/merge-two-arrays-with-alternating-values
    return x === undefined
      ? rest.length === 0
        ? []
        : mergeAltArrays(...rest)
      : [x, ...mergeAltArrays(...rest, xs)];
  };

  const controlEquals = (ctxt) => {
    if (
      ctxt.state == STATES.EQUALS &&
      ctxt.lastOperand &&
      ctxt.lastOperator &&
      ctxt.operands.length > 0
    ) {
      const equation =
        ctxt.operands[0] + ctxt.lastOperator + '(' + ctxt.lastOperand + ')';
      ctxt.operands[0] = parseFloat(
        eval(equation.replace(/×/g, '*')).toPrecision(11)
      );
      ctxt.stringValue = String(ctxt.operands[0]);
    } else if (ctxt.operators.length > 0) {
      const newCtx = { ...contextNew };
      newCtx.theme = ctxt.theme;
      newCtx.lastOperand = ctxt.operands.slice(-1)[0];
      newCtx.lastOperator = ctxt.operators.slice(-1)[0];

      newCtx.stringValue = calculate(ctxt.operands, ctxt.operators);
      if (newCtx.stringValue != ERR) {
        newCtx.operands[0] = newCtx.stringValue;
      }
      return newCtx;
    }
    return ctxt;
  };
  const equationGet = (operands, operators) => {
    const operandsInBrackets = operands.map((op, index) =>
      String(op).startsWith('-') && index > 0 ? '(' + op + ')' : op
    );

    return mergeAltArrays(operandsInBrackets, operators);
  };
  const equationAsString = (ctxt) => {
    const merged = equationGet(ctxt.operands, ctxt.operators);
    return merged.join('').replace(/\//g, '÷');
  };
  const calculate = (operands, operators) => {
    const merged = equationGet(operands, operators);
    //last element can't be an operator
    const lastElement = merged.pop();
    if (OPERATORS.includes(lastElement)) {
      if (operands.length == 1) {
        merged.push(lastElement);
        // brakets necessary for single calcualtion to avoid "--" bug
        merged.push('(' + operands[0] + ')');
      }
    } else {
      merged.push(lastElement);
    }
    const equation = merged.join('').replace(/×/g, '*');
    const regex = /\/0(?![\.])/;
    const result =
      !equation || equation.match(regex) || equation.includes('Infinity')
        ? ERR
        : parseFloat(eval(equation).toPrecision(11));
    return result;
  };

  const renderRow = (row) => {
    let currentRow = row;

    if (row[0].value == ALL_CLEAR && clearable(context)) {
      currentRow = [...row];
      currentRow[0].value = CLEAR;
    }

    return currentRow.map((item) => {
      return (
        <TouchableOpacity
          key={item.value}
          style={styles.button(
            item.type,
            BtnWidth,
            isOperatorSelected(item.value),
            context.theme
          )}
          onPress={() => buttonPressed(item.value)}>
          <Text
            style={styles.text(
              item.type,
              isOperatorSelected(item.value),
              context.theme
            )}>
            {item.value}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  const renderThemesButtons = () => {
    const currentThemesButtons = themesButtons.filter(
      (item) => item.name != context.theme
    );

    return currentThemesButtons.map((item) => {
      return (
        <TouchableOpacity
          key={item.name}
          style={styles.themeButton(item.bgColor, themeBtnWidth)}
          onPress={() => themeButtonPressed(item.name)}
        />
      );
    });
  };

  const isOperatorSelected = (value) => {
    return (
      context.state == STATES.OPERATOR &&
      context.operators.length > 0 &&
      value == context.operators.slice(-1)[0]
    );
  };

  return (
    <View style={styles.container(context.theme)}>
      <View style={styles.themeButtonContainer(context.theme)}>
        {renderThemesButtons()}
      </View>
      <SafeAreaView style={[styles.container(context.theme), styles.safeArea]}>
        <Text style={styles.equationField(context.theme)}>
          {equationAsString(context)}
        </Text>

        <Text
          style={styles.resultField(
            context.stringValue,
            context.theme,
            windowWidth
          )}>
          {context.stringValue}
        </Text>

        <View style={styles.row}>{renderRow(row1)}</View>

        <View style={styles.row}>{renderRow(row2)}</View>

        <View style={styles.row}>{renderRow(row3)}</View>

        <View style={styles.row}>{renderRow(row4)}</View>

        <View style={styles.row}>{renderRow(row5)}</View>

        <StatusBar style="grayscale" />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: (theme) => {
    const bgColor = theme == 'grayscale' ? '#BFBFBF' : '#000';
    return {
      flex: 1,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'flex-end',
    };
  },

  safeArea: {
    margin: 20,
  },

  row: {
    flexDirection: 'row',
  },
  resultField: (stringValue, theme, windowWidth) => {
    let len = String(stringValue).length;
    len = len < 9 ? 8 : len;

    const size = (70 / 51.75) * ((1 / len) * windowWidth);
    const fontSize = size >= 47 ? size : 47;

    const color = theme == 'grayscale' ? '#000' : '#fff';

    return {
      fontSize: fontSize,
      color: color,
      minWidth: '100%',
      textAlign: 'right',
    };
  },
  equationField: (theme) => {
    const color = theme == 'grayscale' ? '#333333' : '#A6A6A6';
    return {
      flex: 1,
      color: color,
      marginBottom: 20,
      minWidth: '100%',
      fontSize: 30,
      padding: 10,
    };
  },
  text: (type, isSelected, theme) => {
    let color = type == 1 ? '#000' : '#fff';

    if (type == 2 && isSelected) {
      color =
        theme == 'cyan' ? '#0984E3' : theme == 'ios' ? '#FF9501' : '#000000';
    }

    return {
      fontSize: 30,
      fontWeight: '500',
      textAlign: 'center',
      color: color,
    };
  },
  button: (type, width, isSelected, theme) => {
    let bgColor =
      type == 1 ? '#A6A6A6' : theme == 'grayscale' ? '#4F4F4F' : '#333333';

    if (type == 2) {
      bgColor = isSelected
        ? '#fff'
        : theme == 'cyan'
        ? '#0984E3'
        : theme == 'ios'
        ? '#FF9501'
        : '#000000';
    }
    const w = type == 3 ? width * 2 : width;
    return {
      width: w,
      height: width,
      borderRadius: width / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: bgColor,
      margin: 5,
    };
  },
  themeButtonContainer: (theme) => {
    const bgColor = theme == 'grayscale' ? '#BFBFBF' : '#000';

    return {
      justifyContent: 'flex-end',
      flexDirection: 'row',
      backgroundColor: bgColor,
    };
  },

  themeButton: (bgColor, themeBtnWidth) => {
    const height = themeBtnWidth * 2;
    const marginTop = -(height * 0.2);
    const borderRadius = height * 0.15;

    return {
      width: themeBtnWidth,
      height: height,
      backgroundColor: bgColor,
      marginLeft: 6,
      borderColor: '#000',
      borderRadius: borderRadius,
      marginTop: marginTop,
    };
  },
});
