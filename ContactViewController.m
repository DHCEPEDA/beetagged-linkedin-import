//
//  ContactViewController.m
//  Bees Chest
//
//  Created by Billy Irwin on 1/1/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import "ContactViewController.h"
#import "ProfileDetailCell.h"
#import "GCPlaceholderTextView.h"

#define infoFrame(y) CGRectMake(120, y, 180, 40)

@interface ContactViewController ()

@property (nonatomic, strong) NSMutableArray *deleted;
@property (nonatomic, strong) NSMutableArray *added;
@property (nonatomic, assign) NSInteger itemToDelete;
@property (nonatomic, assign) BOOL isCurrentlyDeleting;
@property (nonatomic, strong) UIToolbar *toolbar;
@end

@implementation ContactViewController

static const float margin = 15.0;
static const float tfHeight = 54.0;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
    }
    return self;
}

#pragma mark View Loading
- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.tagsCollectionView.delegate = self;
    self.tagsCollectionView.dataSource = self;
    self.tagsCollectionView.backgroundColor = [UIColor clearColor];
    self.expandedRows = [[NSMutableDictionary alloc] init];
    
    [self typeahead];
    self.deleted = [@[] mutableCopy];
    self.added = [@[] mutableCopy];
    self.itemToDelete = -1;
    self.contactTags = [[self.contact.tags_ allValues] mutableCopy];
    if (!self.contactTags) {
        self.contactTags = [[NSMutableArray alloc] init];
    }
    self.isCurrentlyDeleting = NO;
    [self.tagsCollectionView registerClass:[TagCell class] forCellWithReuseIdentifier:@"TagCollectionCell"];
}


//renders the contact and performs logic to decide if it is you or another contact
- (void)renderContact:(Contact *)c {
    if (c == nil) {
        NSLog(@"current user");
        self.isCurrentUser = YES;
        self.contact = [[FBManager singleton] currentParseUser];
        self.navigationController.navigationBar.hidden = YES;
    } else {
        self.contact = c;
        [self.contact updateWithCallback:^{
            [self.profileTableView reloadData];
        }];
    }
    [self.profileTableView reloadData];
    
}

// style the typeahead view
- (void)typeahead {
    float top = 70.0, left = 20.0, height = 180.0;

    self.typeAheadViewController = [[BATypeAheadViewController alloc] initWithFrame:CGRectMake(left, top, self.view.frame.size.width - left * 2, height) andData:[[FBManager singleton] tagOptionsArray]];
    self.typeAheadViewController.delegate = self;
    self.typeAheadViewController.view.layer.cornerRadius = 10.0;
    self.typeAheadViewController.view.backgroundColor = [UIColor colorWithRed:236.0/255.0 green:240.0/255.0 blue:241.0/255.0 alpha:.95];
    self.typeAheadViewController.view.tableView.backgroundColor = [UIColor clearColor];
    [self.typeAheadViewController hideView:NO];
    [self addChildViewController:self.typeAheadViewController];
    [self.view addSubview:self.typeAheadViewController.view];
}

- (void)viewDidAppear:(BOOL)animated {
    [super viewDidAppear:animated];
    
}

- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    
    if (!self.contact) {
        [self renderContact:nil]; //render current user for profile
    }
    
    if (self.isCurrentUser) {
        self.navigationController.navigationBar.hidden = YES;
        [self useToolbar];
    } else {
        self.navigationController.navigationBar.hidden = NO;
    }
    
}

// handles the logic for adding the toolbar that allows the logout functionality.
- (void)useToolbar {
    float height = 60;
    float tabBarHeight = 49.0;
    self.toolbar = [[UIToolbar alloc] initWithFrame:CGRectMake(0, 0, kWidth, height)];
    [self.view addSubview:self.toolbar];
    [self.profileTableView setFrame:CGRectMake(0, height, kWidth, kHeight - height - tabBarHeight)];
    
    UIBarButtonItem *logoutButton = [[UIBarButtonItem alloc] initWithTitle:@"Logout"
                                                                     style:UIBarButtonItemStylePlain
                                                                    target:self
                                                                    action:@selector(logout)];
    [logoutButton setTintColor:[UIColor goldBeeColor]];
    NSArray *buttons = @[logoutButton];
    [self.toolbar setItems:buttons];
}

// logout the current user
- (void)logout {
    [[FBManager singleton] clearDB];
    [PFUser logOut];
    [self.navigationController popToRootViewControllerAnimated:YES];

}

// save the data to parse before we leave
- (void)viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    NSLog(@"callingnow");
    
    [self updateAddedTagsInParse];
    [self updatedDeletedTagsInParse];
    
    if (self.tmpLocation) {
        self.contact.locationName = self.tmpLocation;
    }
    if ([PFUser currentUser]) {
        NSLog(@"call");
        [self.contact saveContactToParse];
    }
}

#pragma mark TableView
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return 4;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath {
    // always 150 for the profileView
    if (indexPath.row == 0) {
        return 150.0;
    } else if (indexPath.row == 1) {
        if (self.contact.profileAttributeKeys && self.contact.profileAttributeKeys.count > 0) {
            if ([self.contact.profileAttributeKeys containsObject:kContactWork]) {
                NSArray *detailAttributes = [self.contact detailAttributesFor:kContactWork];
                return detailAttributes.count * tfHeight + margin;
            }
        }
        return tfHeight + margin;
    } else if (indexPath.row == 2) {
        if (self.contact.profileAttributeKeys && self.contact.profileAttributeKeys.count > 0) {
            
            if ([self.contact.profileAttributeKeys containsObject:kContactEducation]) {
                NSArray *detailAttributes = [self.contact detailAttributesFor:kContactEducation];
                return detailAttributes.count * tfHeight + margin;
            }
        }
        return tfHeight + margin;
    } else {
        return 200;
    }
}

-(NSString *)getLabelText:(NSString *)s {
    if (s && s.length > 0) {
        return s;
    } else {
        return @"N/A";
    }
}

- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string {
    NSLog(@"dsfsd");
    if (textField.tag == 6) {
        NSString *s = [textField.text stringByAppendingString:string];
        self.tmpLocation = s;
        NSLog(@"updating");
    }
    
    return YES;
}

- (UITableViewCell*)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    // top cell, well formatted
    if (indexPath.row == 0) {
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kProfileHeaderCell forIndexPath:indexPath];
        cell.selectionStyle = UITableViewCellSelectionStyleNone;
        UIImageView *imageView = (UIImageView*)[cell viewWithTag:1];
        [imageView setImageWithURL:[NSURL URLWithString:self.contact.pictureUrl]];
        
        UILabel *nameLabel = (UILabel*)[cell viewWithTag:2];
        nameLabel.text = [self getLabelText:[self.contact name]];
        
        UILabel *genderLabel = (UILabel*)[cell viewWithTag:3];
        genderLabel.text = [self getLabelText:[self.contact.gender capitalizedString]];
        
        UILabel *relationshipStatusLabel = (UILabel*)[cell viewWithTag:4];
        relationshipStatusLabel.text = [self getLabelText:[self.contact.relationshipStatus capitalizedString]];
        
        UILabel *hometownLabel = (UILabel*)[cell viewWithTag:5];
        hometownLabel.text = [self getLabelText:self.contact.hometown];
        
        UITextField *locationLabel = (UITextField*)[cell viewWithTag:6];
        locationLabel.text = [self getLabelText:self.contact.locationName];
        locationLabel.delegate = self;
        
        NSLog(@"location %@", [self getLabelText:self.contact.locationName]);
        return cell;
    
    // last cell, statically formatted with a collectionView
    } else if (indexPath.row == 1) {
        ProfileDetailCell *cell = (ProfileDetailCell *)[tableView dequeueReusableCellWithIdentifier:kProfileDetailCell forIndexPath:indexPath];
        UILabel *l = (UILabel*)[cell viewWithTag:1];
        l.text = [kContactWork capitalizedString];
        UIButton *button = (UIButton *)[cell viewWithTag:2];
        [button setTintColor:[UIColor goldBeeColor]];
        [button addTarget:self action:@selector(addOrDelete:) forControlEvents:UIControlEventTouchUpInside];
        
        if (cell.textFields) {
            for (UITextField *tf in cell.textFields) {
                [tf removeFromSuperview];
            }
            [cell.textFields removeAllObjects];
        } else {
            cell.textFields = [[NSMutableArray alloc] init];
        }
        
        return [self updateProfileViewCell:cell atIndexPath:indexPath withKey:kContactWork];
    } else if (indexPath.row == 2) {
        ProfileDetailCell *cell = (ProfileDetailCell*)[tableView dequeueReusableCellWithIdentifier:kProfileDetailCell forIndexPath:indexPath];
        UILabel *l = (UILabel*)[cell viewWithTag:1];
        l.text = [kContactEducation capitalizedString];
        
        UIButton *button = (UIButton *)[cell viewWithTag:2];
        [button setTintColor:[UIColor goldBeeColor]];
        [button addTarget:self action:@selector(addOrDelete:) forControlEvents:UIControlEventTouchUpInside];
        
        if (cell.textFields) {
            for (UITextField *tf in cell.textFields) {
                [tf removeFromSuperview];
            }
            [cell.textFields removeAllObjects];
        } else {
            cell.textFields = [[NSMutableArray alloc] init];
        }
        
        return [self updateProfileViewCell:cell atIndexPath:indexPath withKey:kContactEducation];
    } else {
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"CollectionCell" forIndexPath:indexPath];
        cell.selectionStyle = UITableViewCellSelectionStyleNone;
        UICollectionView *collectionView = (UICollectionView*)[cell viewWithTag:2];
        self.tagsCollectionView = collectionView;
        [self.tagsCollectionView reloadData];
        return cell;
    }

}


- (ProfileDetailCell *)updateProfileViewCell:(ProfileDetailCell *)cell atIndexPath:(NSIndexPath *)indexPath withKey:(NSString *)key {

    // make sure we don't get null errors
    if (!self.contact.profileAttributeKeys || self.contact.profileAttributeKeys.count == 0) {
        NSLog(@"This contact has no profileAttributeKeys");
        return cell;
    }
    
    if (![self.contact.profileAttributeKeys containsObject:key]) {
        NSLog(@"This key does not exist");
        return cell;
    }

    NSMutableArray *detail = [self.contact detailAttributesFor:key];
    NSInteger rows = detail.count;
    
    // set the start height
    float h = 30.0;
    
    for (int i = 1; i < rows; i++) {
        NSDictionary *d = detail[i];
        
        GCPlaceholderTextView *t1 = [[GCPlaceholderTextView alloc] initWithFrame:CGRectMake(margin, h, kWidth / 2 - margin, tfHeight)];
        t1.font = [UIFont fontWithName:@"HelveticaNeue-Thin" size:15.0];
        t1.backgroundColor = [UIColor clearColor];
        if ([d[@"header"] isEqualToString:@"Enter Education Level"] ||
             [d[@"header"] isEqualToString:@"Enter Employer"]) {
            t1.placeholder = [d[@"header"] capitalizedString];
        } else {
            t1.text = [d[@"header"] capitalizedString];
        }
        t1.delegate = self;
        t1.scrollEnabled = NO;
        t1.editable = YES;
        t1.returnKeyType = UIReturnKeyDone;
        [cell addSubview:t1];
        [cell.textFields addObject:t1];
        
        GCPlaceholderTextView *t2 = [[GCPlaceholderTextView alloc] initWithFrame:CGRectMake(kWidth / 2, h, kWidth / 2 - margin, tfHeight)];
        t2.font = [UIFont fontWithName:@"HelveticaNeue-Thin" size:15.0];
        t2.backgroundColor = [UIColor clearColor];
        if ([d[@"value"] isEqualToString:@"Enter School"] ||
            [d[@"value"] isEqualToString:@"Enter Position"]) {
            t2.placeholder = [d[@"value"] capitalizedString];
        } else {
            t2.text = [d[@"value"] capitalizedString];
        }
        t2.delegate = self;
        t2.scrollEnabled = NO;
        t2.editable = YES;
        t2.returnKeyType = UIReturnKeyDone;
        [cell addSubview:t2];
        [cell.textFields addObject:t2];
        
        // on to the next one
        h += tfHeight;

    }
    
    return cell;
}

- (void)dismiss {
    [self resignFirstResponder];
}

// this is the function that does logic on which text field to add or delete when
// the @"+" or @"-" button is pressed in the top right corner of the profile detail
// cell.
- (void)addOrDelete:(UIButton *)sender {
    NSLog(@"Add or Delete");
    ProfileDetailCell *cell = [self getProfileDetailCellFromView:sender];
    UILabel *label = (UILabel *)[cell viewWithTag:1];
    if ([sender.titleLabel.text isEqualToString:@"+"]) {
        if ([[label.text lowercaseString] isEqualToString:kContactWork]) {
            if (self.contact.work == nil) {
                self.contact.work = [NSMutableArray array];
            }
            [self.contact.work addObject:[@{kContactEmployer : @"Enter Employer", kContactPosition : @"Enter Position"} mutableCopy]];
            NSLog(@"work = %@", self.contact.work);
        } else if ([[label.text lowercaseString] isEqualToString:kContactEducation]) {
            if (self.contact.education == nil) {
                self.contact.education = [NSMutableArray array];
            }
            [self.contact.education addObject:[@{kContactType : @"Enter Education Level", kContactSchool: @"Enter School"} mutableCopy]];
            NSLog(@"edu = %@", self.contact.education);
        } else {
            NSLog(@"UH OH!  Something went wrong here, and the labels aren't marked right");
        }
    } else if ([sender.titleLabel.text  isEqualToString:@"-"]) {
        self.isCurrentlyDeleting = YES;
        NSInteger toDelete = [self selectedRowInCell:cell];
        if ([[label.text lowercaseString] isEqualToString:kContactWork]) {
            [self.contact.work removeObjectAtIndex:toDelete];
        } else if ([[label.text lowercaseString] isEqualToString:kContactEducation]) {
            [self.contact.education removeObjectAtIndex:toDelete];
        } else {
            NSLog(@"we should be deleting the text field that we are currently on");
        }
    } else {
        NSLog(@"uh oh... what the hell does our button say?");
    }
    [self.profileTableView reloadData];
}

// fired when you stop editing the text field -- if this is a a saved text field,
// and you didn't delete it, we will update that data in the core data model
- (void)textViewDidEndEditing:(UITextView *)textView {
    NSLog(@"done editing");
    UIButton *b = [self getButtonFromTextView:textView];
    [b setTitle:@"+" forState:UIControlStateNormal];
    
    if (self.isCurrentlyDeleting == YES) {
        self.isCurrentlyDeleting = NO;
        return;
    }
    
    ProfileDetailCell *cell = [self getProfileDetailCellFromView:textView];
    UILabel *label = (UILabel *)[cell viewWithTag:1];
    NSString *key =  label.text;
    NSInteger count = 0;
    
    // get which text label to use
    for (UITextView *tv in cell.textFields) {
        if (tv == textView) {
            break;
        }
        count++;
    }
    
    // figure out which type to edit
    UITextField *headerTV, *valueTV;
    if (count % 2 == 0) {
        headerTV = (UITextField *)cell.textFields[count];
        valueTV = (UITextField *)cell.textFields[count + 1];
    } else {
        headerTV = (UITextField *)cell.textFields[count - 1];
        valueTV = (UITextField *)cell.textFields[count];
    }
    
    
    if ([[key lowercaseString] isEqualToString:kContactEducation]) {
        [self.contact updateEducationAtIndex:count/2 withHeader:headerTV.text andValue:valueTV.text];
    } else if ([[key lowercaseString] isEqualToString:kContactWork]) {
        [self.contact updateWorkAtIndex:count/2 withHeader:headerTV.text andValue:valueTV.text];
    }
    
    if (textView.tag == 6) {
        self.tmpLocation = textView.text;
    }
}

#pragma mark figure out what to add / delete
-(ProfileDetailCell *)getProfileDetailCellFromView:(UIView *)view {
    while (view && [view class] != [ProfileDetailCell class]) {
        view = view.superview;
    }
    return (ProfileDetailCell *)view;
}

- (UIButton *)getButtonFromTextView:(UITextView *)tv {
    ProfileDetailCell *cell = [self getProfileDetailCellFromView:tv];
    UIButton *b = (UIButton *)[cell viewWithTag:2];
    return b;
}

- (UILabel *)getLabelFromButton:(UIButton *)b {
    ProfileDetailCell *cell = [self getProfileDetailCellFromView:b];
    UILabel *l = (UILabel *)[cell viewWithTag:1];
    return l;
}

- (NSInteger)selectedRowInCell:(ProfileDetailCell *)cell {
    NSInteger row = 0;
    for (UITextField *tf in cell.textFields) {
        if ([tf isFirstResponder]) {
            return row / 2;
        }
        row++;
    }
    [NSException raise:@"Row Not In Cell" format:@"There are not %d cells in the text view", row];
    return 0;
}

// change the button from @"+" to @"-"
- (void)textViewDidBeginEditing:(UITextView *)textView {
    UIButton *b = [self getButtonFromTextView:textView];
    [b setTitle:@"-" forState:UIControlStateNormal];
}

// make sure that hitting the done key will take away the keyboard
- (BOOL)textView:(UITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text; {
    if ([text isEqualToString:@"\n"]) {
        [textView resignFirstResponder];
        return NO;
    }
    return YES;
}

// delete on parse (everything else should be taken care of)
- (void)updatedDeletedTagsInParse {
    NSLog(@"deleting %@", self.deleted);
    
    for (Tag *t in self.deleted) {
        [self.contact.tags_ removeObjectForKey:t.attributeName];
        [[FBManager singleton].tagIndex remove:self.contact forTag:t];
    }
    
    NSMutableArray *parseTags = [self makeParseTags:self.deleted];
   [PFObject deleteAllInBackground:parseTags block:^(BOOL succeeded, NSError *error) {
        if (error) {
            NSLog(@"Error: %@", [error localizedDescription]);
        }
        if (succeeded) {
            self.deleted = [@[] mutableCopy];
        }
    }];
}

// 1. add to parse
// 2. update the objects in the db and save to core data
- (void)updateAddedTagsInParse {
    NSLog(@"adding %@", self.added);
    if (self.added.count == 0 || !self.added) return;
    __block NSMutableArray *parseTags = [self makeParseTags:self.added];
    [PFObject saveAllInBackground:parseTags block:^(BOOL succeeded, NSError *error) {
        if (error) {
            NSLog(@"Error: %@", error);
        }
        if (succeeded) {
            NSLog(@"save in background succeeeded");
            for (PFObject *o in parseTags) {
                NSLog(@"objectid %@", o.objectId);
                Tag *t = [Tag tagFromParse:o];
                if (!self.contact.tags_) {
                    self.contact.tags_ = [[NSMutableDictionary alloc] init];
                }
                self.contact.tags_[t.attributeName] = t;
                
                [[[FBManager singleton] tagIndex] add:self.contact forTag:t andSort:YES];
            }
            self.added = [@[] mutableCopy];
        }
    }];
}

- (NSMutableArray *)makeParseTags:(NSMutableArray *)ts {
    NSMutableArray *parseTags = [[NSMutableArray alloc] initWithCapacity:self.added.count];
    // make all of the array objects a PFObject
    for (Tag *t in ts) {
        t.rank = @(0);
        [parseTags addObject:[t pfObject]];
    }
    return parseTags;
}

// gives the headline for the Contact
- (NSString *)getHeadline {
    NSString *headline = @"A good friend with no headline";
    if (self.contact.headline && self.contact.headline.length > 0) {
        headline = self.contact.headline;
    }
    return headline;
}

// gets the title for the position
- (NSString *)getPositionTitle {
    NSString *positionTitle = @"";
    if (self.contact.positionTitle && self.contact.positionTitle.length > 0) {
        positionTitle = self.contact.positionTitle;
    }
    return positionTitle;
}

// gets the name for the position
- (NSString *)getPositionName {
    NSString *positionName = @"";
    if (self.contact.positionName && self.contact.positionName.length > 0) {
        positionName = [NSString stringWithFormat:@"At %@", self.contact.positionName];
    }
    return positionName;
}

// removes a subview from the main view and returns how hight
// the next view needs to move "up" to replace that view.
-(CGFloat)removeViewOfHeight:(UIView *)view {
    CGFloat height = view.frame.size.height;
    [view removeFromSuperview];
    return height;
}

// moves the view up and makes it bigger
- (void)moveView:(UIView *)view upBy:(CGFloat)distance andIncreaseHeight:(CGFloat)increase {
    CGRect f = view.frame;
    [view setFrame:CGRectMake(f.origin.x, f.origin.y - distance, f.size.width, f.size.height + increase)];
}

#pragma mark Button Actions
// action for when you press the picture that sends you to linkedin.com
- (IBAction)goToLinkedInProfile:(id)sender {
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:self.contact.linkedInUrl]];
}

#pragma mark CollectionView
- (NSInteger)collectionView:(UICollectionView *)view numberOfItemsInSection:(NSInteger)section {
    return self.contactTags.count + 1;
}


// called when the item is selected - will only do anything if the add button
// is selected
- (void)collectionView:(UICollectionView *)collectionView didSelectItemAtIndexPath:(NSIndexPath *)indexPath {
    [collectionView deselectItemAtIndexPath:indexPath animated:YES];
    // if it's the last item, add a new item
    if (indexPath.item == self.contactTags.count) {
        if (self.itemToDelete != -1) {
            NSInteger hold = self.itemToDelete;
        } else {
            [self showAddTagView];
        }
    } else {
        [self deleteTagAtIndexPath:indexPath];
    }
}

// style the collectionView cell at the indexPath
- (UICollectionViewCell *)collectionView:(UICollectionView *)cv cellForItemAtIndexPath:(NSIndexPath *)indexPath {
    static NSString *tagCellIdentifier = @"TagCollectionCell";
    TagCell *cell = (TagCell *)[cv dequeueReusableCellWithReuseIdentifier:tagCellIdentifier forIndexPath:indexPath];
    cell.backgroundColor = [UIColor cloudsColor];
    UILabel *label = (UILabel *)[cell viewWithTag:1];
    label.backgroundColor = [UIColor clearColor];
    
    NSInteger i = indexPath.item;
    cell.itemIndex = i;
    cell.delegate = self;
    
    BOOL isReloadingForDelete = (self.itemToDelete != -1);
    
    // 1. There is no cell being deleted
    if (!isReloadingForDelete) {
        if (i < self.contactTags.count) {
            [cell addLongPress];
            Tag *tag = self.contactTags[i];
            label.text = tag.attributeName;
            label.textColor = [UIColor goldBeeColor];
        } else {
            label.text = @"+";
            label.font = [UIFont fontWithName:@"HelveticaNeue-Bold" size:50.0];
            float cellHeight = cell.frame.size.height, labelHeight = label.frame.size.height;
            float offset = cellHeight - labelHeight - 3.0;
            label.frame = CGRectMake(0, offset, cell.frame.size.width *2, labelHeight);
            label.textColor = [UIColor goldBeeColor];
        }
    } else {
        if (i < self.contactTags.count) {
            [cell turnOnDelete];
        } else {
            label.text = @"BACK";
            label.font = [UIFont fontWithName:@"HelveticaNeue-Bold" size:18.0];
            label.textColor = [UIColor whiteColor];
        }
    }
    

    if (indexPath.item >= self.contactTags.count) {
        NSDictionary *attributes = [NSDictionary dictionaryWithObjectsAndKeys:[UIFont fontWithName:@"HelveticaNeue-Bold" size:55.0], NSFontAttributeName, nil];
        CGSize s = CGSizeMake([@"+" sizeWithAttributes:attributes].width + 20, 50);
        [label setFrame:CGRectMake(0, -5, s.width, s.height)];
    } else {
        NSDictionary *attributes = [NSDictionary dictionaryWithObjectsAndKeys:[UIFont fontWithName:@"HelveticaNeue-Thin" size:20.0], NSFontAttributeName, nil];
        CGSize s = CGSizeMake([[self.contactTags[indexPath.item] attributeName] sizeWithAttributes:attributes].width, 50);
        [label setFrame:CGRectMake(10, 0, s.width, s.height)];
    }
    
    label.textAlignment = NSTextAlignmentCenter;
    return cell;
}

- (CGSize)collectionView:(UICollectionView *)collectionView layout:(UICollectionViewLayout*)collectionViewLayout sizeForItemAtIndexPath:(NSIndexPath *)indexPath {

    if (indexPath.item >= self.contactTags.count) {
        NSDictionary *attributes = [NSDictionary dictionaryWithObjectsAndKeys:[UIFont fontWithName:@"HelveticaNeue-Bold" size:55.0], NSFontAttributeName, nil];
        return CGSizeMake([@"+" sizeWithAttributes:attributes].width + 20, 50);
    } else {
        NSDictionary *attributes = [NSDictionary dictionaryWithObjectsAndKeys:[UIFont fontWithName:@"HelveticaNeue-Thin" size:20.0], NSFontAttributeName, nil];
        return CGSizeMake([[self.contactTags[indexPath.item] attributeName] sizeWithAttributes:attributes].width + 20, 50);
    }
}


#pragma mark - Tag insert/remove
- (void)addTagToCollectionView:(Tag *)tag {
    
    for (Tag *check in self.contactTags) {
        // make sure that there are no duplicates
        if ([check.attributeName isEqualToString:tag.attributeName]) {
            return;
        }
    }

    [self.contactTags addObject:tag];
    [self addedTag:tag];
    //[self resetContactTags];
}

// adds the tag to the added changeList
- (void)addedTag:(Tag *)tag {
    for (Tag *t in self.deleted) {
        NSInteger index = 0;
        if ([t.attributeName isEqualToString:tag.attributeName]) {
            [self.deleted removeObjectAtIndex:index];
            return;
        }
        index++;
    }
    [self.added addObject:tag];
    [self.tagsCollectionView reloadData];
    
    
}

// adds the tag to the deleted changeList
- (void)deletedTag:(Tag *)tag {
    for (Tag *t in self.added) {
        NSInteger index = 0;
        if ([t.attributeName isEqualToString:tag.attributeName]) {
            [self.added removeObjectAtIndex:index];
            return;
        }
        index++;
    }
    [self.deleted addObject:tag];
}

// deletes a Tag object at the indexPath
// deletes a Tag object from Core Data
- (void)deleteTagAtIndexPath:(NSIndexPath *)indexPath {
    Tag *tag = [self.contactTags objectAtIndex:indexPath.item];
    [self.contactTags removeObjectAtIndex:indexPath.item];
    [self deletedTag:tag];
    [self.tagsCollectionView reloadData];
}

// This is is what brings the typeahead view onto the screen and shows the
// the keyboard
- (void)showAddTagView {
    [self.typeAheadViewController showView:YES];
}

// This is the delegate method that is called when on of the items from the
// typeahead is chosen.  It dimisses the keyboard, moves the view offscreen,
// and adds the tag to the collectionView
- (void)cellClickedWithData:(id)data {
    Tag *t = [Tag tagFromTagOption:(TagOption *)data taggedUser:self.contact.fbId byUser:[[PFUser currentUser] objectForKey:@"fbId"]];
    
    // 1. make the view go away.
    [self.typeAheadViewController hideView:YES];
    
    // 2. add the Tag
    [self addTagToCollectionView:t];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
}



@end
