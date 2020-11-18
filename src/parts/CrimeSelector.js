import { React, useState } from 'react';
//import SwipeableViews from 'react-swipeable-views';
import { Tabs, Tab, ButtonGroup, Button, Checkbox, FormControl, FormControlLabel, FormGroup, Radio, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useCrimes, useCrimeCategories } from '../util';

const nameOfStages = new Map([
  ["preparatory", "預備"],
  ["attempted", "未遂"],
  ["accomplished", "既遂"],
]);

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
  },
  tab: {
    minWidth: 64,
    flexGrow: 1,
  },
  panel: {
    margin: theme.spacing(1),
  },
  stages: {
    display: 'flex',
    marginTop: theme.spacing(1),
  },
  stageLabel: {
    marginBottom: theme.spacing(1),
  },
  stage: {
    flexGrow: 1,
    '&[data-checked]': {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
    }
  },
}), { name: 'CrimeSelector' });

function TabPanel(props) {
  const { children, currentIndex, index, ...others } = props;
  return (
    <div role="tabpanel" hidden={currentIndex !== index} id={`crime-panel-${index}`} aria-labelled-by={`crime-tab-${index}`} {...others}>
      { currentIndex === index && children }
    </div>
  );
};

export default function CrimeSelector(props) {
  const classes = useStyles();
  const crimes = useCrimes();
  const categories = useCrimeCategories();
  const listOfCategories = [...categories.values()];

  // Props
  const { value, onChange } = props;

  // Calculate controls’ state base on prop value
  const crime = crimes.find((c) => c.value === value);
  const category = crime ? categories.get(crime.category) : listOfCategories[0];
  const kind = crime ? category.kinds.get(crime.kind) : null;

  // Our only state; index of the active tab should be independent from prop value or you will never be able to change tabs
  const [currentIndex, setCurrentIndex] = useState(0);

  // Event handlers
  const handleTabChange = (_, newValue) => setCurrentIndex(newValue);
  const handleKindRadioChange = (e) => {
    let crime = crimes.find((c) => c.kind === e.target.value);
    if (crime) onChange(e, crime.value);
  };
  const handleStageButtonClick = (e) => console.log(e);
  const handleVariantCheckboxChange = (e) => console.log(e);

  return (
    <div className={classes.root}>
      <Tabs value={currentIndex} onChange={handleTabChange}
        indicatorColor="primary" textColor="primary" variant="fullWidth" aria-label="罪名分類">
        { listOfCategories.map((c, index) =>
          <Tab key={c.title} value={index} label={c.title}
            id={`crime-tab-${index}`} aria-controls={`crime-panel-${index}`} className={classes.tab} />
        )}
      </Tabs>
      { listOfCategories.map((c, index) =>
        <TabPanel key={c.title} currentIndex={currentIndex} index={index} className={classes.panel}>
          <FormControl component="fieldset">
            { Array.from(c.kinds.values(), (k) =>
              <FormControlLabel key={k.text} value={k.text} checked={k.text === kind?.text} control={<Radio />} label={k.text} onClick={handleKindRadioChange} />
            )}
          </FormControl>
        </TabPanel>
      )}
      <div className={classes.panel}>
        { (kind?.stages) &&
          <FormControl className={classes.stages}>
            <Typography variant="subtitle2" gutterBottom>階段</Typography>
            <ButtonGroup color="primary" aria-label="犯罪階段">
              { Array.from(nameOfStages.keys(), (s) => kind.stages.includes(s) &&
                <Button key={s} value={s} data-checked={crime.stage === s || null} onClick={handleStageButtonClick} className={classes.stage}>{nameOfStages.get(s)}</Button>
              )}
            </ButtonGroup>
          </FormControl>
        }
        { (kind?.variants) &&
          <FormControl component="fieldset">
            <Typography component="legend" variant="subtitle2" gutterBottom>特別規定</Typography>
            <FormGroup>
              { kind.variants.map((v) =>
                <FormControlLabel key={v} label={v} control={
                  <Checkbox checked={crime.variant === v} onChange={handleVariantCheckboxChange} />
                } />
              )}
            </FormGroup>
          </FormControl>
        }
      </div>
    </div>
  );
};
